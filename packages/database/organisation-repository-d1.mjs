// D1 asynchronous implementation. Shares policy and schema with the native services.
import {createHash, randomBytes, randomUUID, scryptSync} from 'node:crypto';
import registry from '../app-registry/index.js';
import {canProvisionOrganisation, canManageOrganisation} from '../auth/organisation-policy.mjs';
import organisationMigrations from '../../infrastructure/cloudflare/organisation-manifest.json' with {type:'json'};

const hash = value => createHash('sha256').update(value).digest('hex');


export class OrganisationError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function reject(code, message) { throw new OrganisationError(code, message); }
async function transaction(db, fn) {
  if (db.isTransaction) reject('transaction-active', 'Use a connection outside an existing transaction');
  (await db.exec('BEGIN IMMEDIATE'));
  try { const value=await fn(); (await db.exec('COMMIT')); return value; }
  catch (error) { (await db.exec('ROLLBACK')); throw error; }
}
function text(value, name, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) reject('invalid-input', `Invalid ${name}`);
  return value.trim();
}
function capacity(value, minimum = 0) {
  if (value !== null && (!Number.isSafeInteger(value) || value < minimum)) reject('invalid-input', 'Invalid seat allowance');
  return value;
}
function timestamp(value) {
  if (typeof value !== 'string') reject('invalid-input', 'Use an ISO UTC timestamp');
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) reject('invalid-input', 'Use a canonical ISO UTC timestamp');
  return parsed;
}

export class OrganisationRepository {
  // Internal service boundary: actorUserId must come from an authenticated
  // session, never a request-body field. No HTTP routes currently call this.
  constructor(db, {clock = Date.now} = {}) {this.db=db;this.clock=clock;}
  async initialise() {
    const db=this.db;
    const exists = (await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='platform_organisation_migrations'").get());
    if (!exists) reject('migration-required', 'Apply the checked organisation migration first');
    const rows = (await db.prepare('SELECT id,checksum FROM platform_organisation_migrations').all());
    if (rows.length !== organisationMigrations.length || !organisationMigrations.every(m => rows.some(row => row.id === m.id && row.checksum === m.checksum))) reject('migration-required', 'Apply the checked organisation migration first');

  }
  now() {
    const value = this.clock();
    if (!Number.isSafeInteger(value) || value < 0) reject('invalid-clock', 'Invalid clock');
    return value;
  }
  async user(userId) {
    const row = (await this.db.prepare('SELECT id,email,active FROM users WHERE id=?').get(text(userId, 'user ID', 200)));
    return row ? {...row, active: row.active === 1} : null;
  }
  async authority(actorUserId) {
    const user = (await this.user(actorUserId));
    const row = user && (await this.db.prepare('SELECT userId,active FROM platform_super_admins WHERE userId=?').get(user.id));
    return {user, platformRole: row ? {...row, role: 'SuperAdmin', active: row.active === 1} : null};
  }
  async requireSuperAdmin(actorUserId) {
    if (!canProvisionOrganisation((await this.authority(actorUserId))).allowed) reject('forbidden', 'Super Admin required');
  }
  async audit(organisationId, actorUserId, action, at, details = {}) {
    (await this.db.prepare('INSERT INTO platform_organisation_audit(organisationId,actorUserId,action,at,details) VALUES(?,?,?,?,?)')
      .run(organisationId, actorUserId, action, at, JSON.stringify(details)));
  }
  // Offline bootstrap only. No Owner inference, HTTP endpoint or environment switch.
  async bootstrapSuperAdmin({userId}) {
    return (await transaction(this.db, async () => {
      if ((await this.db.prepare('SELECT userId FROM platform_super_admins LIMIT 1').get())) reject('already-bootstrapped', 'Initial Super Admin has already been selected');
      const user = (await this.user(userId));
      if (!user?.active) reject('invalid-user', 'Select an existing active account explicitly');
      const now = this.now();
      (await this.db.prepare('INSERT INTO platform_super_admins(userId,active,createdAt) VALUES(?,1,?)').run(userId, now));
      (await this.audit(null, userId, 'SuperAdminBootstrapped', now));
      return {userId, role: 'SuperAdmin'};
    }));
  }
  async provision(input) {
    return (await transaction(this.db, async () => (await this.#provision(input))));
  }
  // Service-only onboarding foundation. No public HTTP endpoint is exposed yet.
  async provisionNewMaster(input) {
    return (await transaction(this.db, async () => {
      (await this.requireSuperAdmin(input.actorUserId));
      const email = text(input.masterAdminEmail, 'email', 200).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reject('invalid-input', 'Invalid email');
      // Never claim an existing identity, including a disabled or pending one.
      if ((await this.db.prepare('SELECT id FROM users WHERE lower(email)=?').get(email))) reject('invalid-user', 'Use the existing-account invitation workflow');
      const userId = randomUUID(), now = this.now();
      (await this.db.prepare("INSERT INTO users(id,name,email,role,password,active) VALUES(?,?,?,'Clerk',?,0)")
        .run(userId, email, email, randomBytes(16).toString('hex') + ':' + randomBytes(64).toString('hex')));
      (await this.db.prepare('INSERT INTO platform_pending_identities(userId,createdAt) VALUES(?,?)').run(userId, now));
      const result = (await this.#provision({...input, masterAdminUserId: userId}, true));
      (await this.audit(result.organisationId, input.actorUserId, 'InvitationIdentityCreated', now, {userId}));
      return {...result, newAccount: true};
    }));
  }
  async #provision({actorUserId, name, type, timezone = 'Asia/Kolkata', masterAdminUserId, staffLimit, clientLimit, licences}, pendingIdentity = false) {
      (await this.requireSuperAdmin(actorUserId));
      name = text(name, 'organisation name', 160); type = text(type, 'organisation type', 80);
      timezone = text(timezone, 'timezone', 100);
      try { new Intl.DateTimeFormat('en', {timeZone: timezone}); } catch { reject('invalid-input', 'Invalid timezone'); }
      capacity(staffLimit, 1); capacity(clientLimit);
      const master = (await this.user(masterAdminUserId));
      if (!master || (!master.active && !pendingIdentity)) reject('invalid-user', 'Select an existing active Master Admin account');
      if (!Array.isArray(licences) || licences.length === 0 || licences.length > registry.apps.length) reject('invalid-input', 'Select private app licences');
      const seen = new Set();
      for (const licence of licences) {
        if (!licence || typeof licence !== 'object') reject('invalid-input', 'Invalid licence');
        const app = registry.apps.find(app => app.id === licence.appId && ['advocate','tournament-lite'].includes(app.id) && app.status === 'Available' && !app.public);
        if (!app || seen.has(app.id)) reject('invalid-input', 'Select unique available private apps');
        seen.add(app.id);
        if (!['Trial', 'Active', 'Scheduled'].includes(licence.status)) reject('invalid-input', 'Invalid initial licence status');
        const start = timestamp(licence.startsAt);
        const end = licence.endsAt === null ? Infinity : timestamp(licence.endsAt);
        if (end <= start) reject('invalid-input', 'Licence end must follow start');
        if (licence.readOnlyUntil !== null && (end === Infinity || timestamp(licence.readOnlyUntil) <= end)) reject('invalid-input', 'Read-only deadline must follow licence end');
        capacity(licence.staffLimit); capacity(licence.clientLimit);
      }
      const now = this.now(), organisationId = randomUUID(), token = randomBytes(32).toString('hex');
      (await this.db.prepare('INSERT INTO platform_organisations(id,name,type,timezone,status,masterAdminUserId,staffLimit,clientLimit,createdAt) VALUES(?,?,?,?,?,?,?,?,?)')
        .run(organisationId, name, type, timezone, 'PendingActivation', master.id, staffLimit, clientLimit, now));
      (await this.db.prepare('INSERT INTO platform_memberships(organisationId,userId,role,status,createdAt) VALUES(?,?,?,?,?)')
        .run(organisationId, master.id, 'MasterAdmin', 'Invited', now));
      for (const licence of licences) (await this.db.prepare('INSERT INTO platform_app_licences(organisationId,appId,status,startsAt,endsAt,readOnlyUntil,staffLimit,clientLimit) VALUES(?,?,?,?,?,?,?,?)')
        .run(organisationId, licence.appId, licence.status, licence.startsAt, licence.endsAt, licence.readOnlyUntil, licence.staffLimit, licence.clientLimit));
      const expiresAt = now + 48 * 60 * 60 * 1000;
      (await this.db.prepare('INSERT INTO platform_organisation_invitations(id,organisationId,userId,email,tokenHash,expiresAt,createdAt) VALUES(?,?,?,?,?,?,?)')
        .run(randomUUID(), organisationId, master.id, master.email, hash(token), expiresAt, now));
      (await this.audit(organisationId, actorUserId, 'OrganisationProvisioned', now, {masterAdminUserId: master.id, appIds: [...seen]}));
      // One-time return to the authorised caller; never persist/log the raw token.
      return {organisationId, status: 'PendingActivation', invitation: {token, expiresAt}};
  }
  async activateNewMaster({token, email, name, password}) {
    return (await transaction(this.db, async () => {
      const invalid = () => reject('invalid-invitation', 'Invitation is invalid or unavailable');
      if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof email !== 'string') invalid();
      const invitation = (await this.db.prepare('SELECT * FROM platform_organisation_invitations WHERE tokenHash=?').get(hash(token)));
      const now = this.now();
      if (!invitation || invitation.email !== email.trim().toLowerCase() || invitation.consumedAt !== null || invitation.revokedAt !== null || now >= invitation.expiresAt) invalid();
      const user = (await this.user(invitation.userId));
      const pending = (await this.db.prepare('SELECT * FROM platform_pending_identities WHERE userId=?').get(invitation.userId));
      const org = (await this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(invitation.organisationId));
      const member = (await this.db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(invitation.organisationId, invitation.userId));
      if (!user || user.active || user.email !== invitation.email || !pending || pending.activatedAt !== null || org?.status !== 'PendingActivation' || org.masterAdminUserId !== user.id || member?.role !== 'MasterAdmin' || member.status !== 'Invited') invalid();
      name = text(name, 'name', 120);
      if (typeof password !== 'string' || password.length < 12 || password.length > 128) reject('invalid-input', 'Use a password between 12 and 128 characters');
      const salt = randomBytes(16).toString('hex');
      const credential = salt + ':' + scryptSync(password, salt, 64).toString('hex');
      (await this.db.prepare('UPDATE users SET name=?,password=?,active=1 WHERE id=?').run(name, credential, user.id));
      (await this.db.prepare('UPDATE platform_pending_identities SET activatedAt=? WHERE userId=?').run(now, user.id));
      const result = (await this.#acceptInvitation({actorUserId: user.id, token}));
      (await this.audit(org.id, user.id, 'InvitationIdentityActivated', now, {userId: user.id}));
      return result;
    }));
  }
  async acceptInvitation({actorUserId, token}) {
    return (await transaction(this.db, async () => (await this.#acceptInvitation({actorUserId, token}))));
  }
  async #acceptInvitation({actorUserId, token}) {
      const user = (await this.user(actorUserId)), now = this.now();
      if (!user?.active || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) reject('invalid-invitation', 'Invitation is invalid or unavailable');
      const invitation = (await this.db.prepare('SELECT * FROM platform_organisation_invitations WHERE tokenHash=?').get(hash(token)));
      if (!invitation || invitation.userId !== user.id || invitation.email !== user.email || invitation.consumedAt !== null || invitation.revokedAt !== null || now >= invitation.expiresAt) reject('invalid-invitation', 'Invitation is invalid or unavailable');
      const org = (await this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(invitation.organisationId));
      const member = (await this.db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(org.id, user.id));
      if (org.status !== 'PendingActivation' || org.masterAdminUserId !== user.id || member?.role !== 'MasterAdmin' || member.status !== 'Invited') reject('invalid-invitation', 'Invitation is invalid or unavailable');
      (await this.db.prepare('UPDATE platform_organisation_invitations SET consumedAt=? WHERE id=?').run(now, invitation.id));
      (await this.db.prepare("UPDATE platform_memberships SET status='Active' WHERE organisationId=? AND userId=?").run(org.id, user.id));
      (await this.db.prepare("UPDATE platform_organisations SET status='Active',version=version+1 WHERE id=?").run(org.id));
      (await this.audit(org.id, user.id, 'OrganisationActivated', now));
      return {organisationId: org.id, status: 'Active'};
  }
  async updateMasterInvitation({actorUserId, organisationId, version, revokeOnly = false}) {
    return (await transaction(this.db, async () => {
      (await this.requireSuperAdmin(actorUserId));
      if (!Number.isSafeInteger(version) || version < 1 || typeof revokeOnly !== 'boolean') reject('invalid-input', 'A valid revision and invitation action are required');
      const org = (await this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(text(organisationId, 'organisation ID', 200)));
      if (!org || org.status !== 'PendingActivation') reject('invalid-state', 'Only pending organisations can update activation invitations');
      if (org.version !== version) reject('conflict', 'Organisation changed; reload before continuing');
      const user = (await this.user(org.masterAdminUserId));
      const pending = user && (await this.db.prepare('SELECT activatedAt FROM platform_pending_identities WHERE userId=?').get(user.id));
      if (!user || (!user.active && (!pending || pending.activatedAt !== null))) reject('invalid-user', 'Master Admin account is inactive');
      const now = this.now();
      (await this.db.prepare('UPDATE platform_organisation_invitations SET revokedAt=? WHERE organisationId=? AND userId=? AND consumedAt IS NULL AND revokedAt IS NULL').run(now, org.id, user.id));
      (await this.db.prepare('UPDATE platform_organisations SET version=version+1 WHERE id=?').run(org.id));
      (await this.audit(org.id, actorUserId, revokeOnly ? 'MasterInvitationRevoked' : 'MasterInvitationReissued', now));
      if (revokeOnly) return {organisationId: org.id, version: version + 1};
      const token = randomBytes(32).toString('hex'), expiresAt = now + 48 * 60 * 60 * 1000;
      (await this.db.prepare('INSERT INTO platform_organisation_invitations(id,organisationId,userId,email,tokenHash,expiresAt,createdAt) VALUES(?,?,?,?,?,?,?)')
        .run(randomUUID(), org.id, user.id, user.email, hash(token), expiresAt, now));
      return {organisationId: org.id, version: version + 1, invitation: {token, expiresAt}};
    }));
  }
  async organisation({actorUserId, organisationId}) {
    const org = (await this.db.prepare('SELECT id,name,type,timezone,status,masterAdminUserId,staffLimit,clientLimit,version,createdAt FROM platform_organisations WHERE id=?').get(text(organisationId, 'organisation ID', 200)));
    if (!org) reject('forbidden', 'Organisation administration unavailable');
    const membership = (await this.db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(org.id, actorUserId));
    if (!canManageOrganisation({...(await this.authority(actorUserId)), organisation: org, membership}).allowed) reject('forbidden', 'Organisation administration unavailable');
    return {...org, licences: (await this.db.prepare('SELECT * FROM platform_app_licences WHERE organisationId=? ORDER BY appId').all(org.id))};
  }
}
