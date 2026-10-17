// Shared, runtime-neutral policy. Callers must load trusted, organisation-scoped
// rows from persistence; request bodies are never an authorization context.
const organisationRoles = new Set(['MasterAdmin', 'Administrator', 'Staff', 'Client']);
const memberTypes = new Set(['Staff', 'Client']);
const actions = new Set(['read', 'write']);
const deny = reason => ({allowed: false, reason});
function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return NaN;
  const parsed = Date.parse(value);
  const canonical = value.length === 20 ? value.replace('Z', '.000Z') : value;
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === canonical ? parsed : NaN;
}
const id = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 200;

export function canManageOrganisation({user, platformRole, organisation, membership}) {
  if (user?.active !== true || !id(user.id)) return deny('inactive-user');
  if (!id(organisation?.id)) return deny('missing-organisation');
  if (platformRole?.userId === user.id && platformRole.role === 'SuperAdmin' && platformRole.active === true) return {allowed: true, scope: 'platform'};
  if (organisation.status !== 'Active') return deny('inactive-organisation');
  if (membership?.organisationId !== organisation.id || membership.userId !== user.id || membership.status !== 'Active') return deny('inactive-membership');
  if (membership.role !== 'MasterAdmin' || organisation.masterAdminUserId !== user.id) return deny('master-admin-required');
  return {allowed: true, scope: 'organisation'};
}

// Platform administration deliberately grants no implicit business-record access.
// Permission strings must be derived by the app from its stored role/ACL, never
// accepted from clients. Record access is a separate mandatory server-side check.
export function evaluateAppAccess({user, organisation, membership, app, licence, assignment, permissions, action, now}) {
  if (!Number.isFinite(now)) return deny('invalid-clock');
  if (!actions.has(action)) return deny('invalid-action');
  if (user?.active !== true || !id(user.id)) return deny('inactive-user');
  if (!id(organisation?.id) || organisation.status !== 'Active') return deny('inactive-organisation');
  if (membership?.organisationId !== organisation.id || membership.userId !== user.id || membership.status !== 'Active' || !organisationRoles.has(membership.role)) return deny('inactive-membership');
  if (!id(app?.id) || app.status !== 'Available' || app.public === true) return deny('private-app-unavailable');
  if (licence?.organisationId !== organisation.id || licence.appId !== app.id || !['Trial', 'Active', 'Expired'].includes(licence.status)) return deny('invalid-licence');
  if (assignment?.organisationId !== organisation.id || assignment.userId !== user.id || assignment.appId !== app.id || assignment.status !== 'Active') return deny('missing-assignment');
  if (!Array.isArray(permissions) || !permissions.includes(`${app.id}:${action}`)) return deny('permission-required');
  const start = instant(licence.startsAt);
  const end = licence.endsAt === null ? Infinity : instant(licence.endsAt);
  if (!Number.isFinite(start) || !(end > start) || now < start) return deny('invalid-licence-window');
  const expired = now >= end || licence.status === 'Expired';
  if (expired) {
    const readUntil = instant(licence.readOnlyUntil);
    if (end === Infinity || !Number.isFinite(readUntil) || readUntil <= end || now >= readUntil) return deny('expired-licence');
    if (action !== 'read') return deny('licence-read-only');
  }
  return {allowed: true, mode: expired ? 'read-only' : 'full', organisationId: organisation.id, appId: app.id};
}

// One global seat per active member, and one seat per active app assignment.
// Clients use separate pools. Existing members can keep working at capacity;
// these checks belong to invitation/activation/assignment transactions only.
export function evaluateSeatAdmission({memberType, limit, used, alreadyCounted = false}) {
  if (!memberTypes.has(memberType) || !Number.isSafeInteger(used) || used < 0 || (limit !== null && (!Number.isSafeInteger(limit) || limit < 0)) || typeof alreadyCounted !== 'boolean') return deny('invalid-capacity');
  if (alreadyCounted || limit === null || used < limit) return {allowed: true};
  return deny('seat-limit-reached');
}

export function canProvisionOrganisation({user, platformRole}) {
  if (user?.active !== true || !id(user.id) || platformRole?.userId !== user.id || platformRole.role !== 'SuperAdmin' || platformRole.active !== true) return deny('super-admin-required');
  return {allowed: true};
}
