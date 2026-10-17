import {DatabaseSync} from 'node:sqlite';
import {createHash, randomBytes, randomUUID, scryptSync} from 'node:crypto';
import registry from '../app-registry/index.js';
import {canProvisionOrganisation, canManageOrganisation} from '../auth/organisation-policy.mjs';
import organisationSchema from './organisation-schema.cjs';

const hash = value => createHash('sha256').update(value).digest('hex');
export const organisationMigrations = organisationSchema.migrations;
export const organisationTables = organisationSchema.tables;
export class OrganisationError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function reject(code, message) { throw new OrganisationError(code, message); }
function transaction(db, fn) {
  if (db.isTransaction) reject('transaction-active', 'Use a connection outside an existing transaction');
  db.exec('BEGIN IMMEDIATE');
  try { const value = fn(); db.exec('COMMIT'); return value; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
function requireSQLite(db) {
  if (!(db instanceof DatabaseSync)) reject('unsupported-database', 'This foundation supports native SQLite only');
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) reject('foreign-keys-required', 'Enable foreign keys before using organisation persistence');
}

// Explicit caller-owned migration; never opens a path or runs on server startup.
export function migrateOrganisationSchema(db) {
  requireSQLite(db);
  return transaction(db, () => {
    db.exec('CREATE TABLE IF NOT EXISTS platform_organisation_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
    const applied = db.prepare('SELECT id,checksum FROM platform_organisation_migrations').all();
    if (applied.some(row => !organisationMigrations.some(m => m.id === row.id && m.checksum === row.checksum))) reject('migration-drift', 'Unknown or modified organisation migration');
    if (applied.length && !organisationMigrations.slice(0,applied.length).every(m => applied.some(row => row.id === m.id))) reject('migration-drift', 'Organisation migration history is not an ordered prefix');
    const pending = organisationMigrations.slice(applied.length);
    for (const migration of pending) {
      db.exec(migration.source);
      db.prepare('INSERT INTO platform_organisation_migrations(id,checksum) VALUES(?,?)').run(migration.id, migration.checksum);
    }
    return {applied: pending.length > 0, ids: pending.map(m => m.id)};
  });
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
  constructor(db, {clock = Date.now} = {}) {
    requireSQLite(db);
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='platform_organisation_migrations'").get();
    if (!exists) reject('migration-required', 'Apply the checked organisation migration first');
    const rows = db.prepare('SELECT id,checksum FROM platform_organisation_migrations').all();
    if (rows.length !== organisationMigrations.length || !organisationMigrations.every(m => rows.some(row => row.id === m.id && row.checksum === m.checksum))) reject('migration-required', 'Apply the checked organisation migration first');
    this.db = db; this.clock = clock;
  }
  now() {
    const value = this.clock();
    if (!Number.isSafeInteger(value) || value < 0) reject('invalid-clock', 'Invalid clock');
    return value;
  }
  user(userId) {
    const row = this.db.prepare('SELECT id,email,active FROM users WHERE id=?').get(text(userId, 'user ID', 200));
    return row ? {...row, active: row.active === 1} : null;
  }
  authority(actorUserId) {
    const user = this.user(actorUserId);
    const row = user && this.db.prepare('SELECT userId,active FROM platform_super_admins WHERE userId=?').get(user.id);
    return {user, platformRole: row ? {...row, role: 'SuperAdmin', active: row.active === 1} : null};
  }
  requireSuperAdmin(actorUserId) {
    if (!canProvisionOrganisation(this.authority(actorUserId)).allowed) reject('forbidden', 'Super Admin required');
  }
  audit(organisationId, actorUserId, action, at, details = {}) {
    this.db.prepare('INSERT INTO platform_organisation_audit(organisationId,actorUserId,action,at,details) VALUES(?,?,?,?,?)')
      .run(organisationId, actorUserId, action, at, JSON.stringify(details));
  }
  // Offline bootstrap only. No Owner inference, HTTP endpoint or environment switch.
  bootstrapSuperAdmin({userId}) {
    return transaction(this.db, () => {
      if (this.db.prepare('SELECT userId FROM platform_super_admins LIMIT 1').get()) reject('already-bootstrapped', 'Initial Super Admin has already been selected');
      const user = this.user(userId);
      if (!user?.active) reject('invalid-user', 'Select an existing active account explicitly');
      const now = this.now();
      this.db.prepare('INSERT INTO platform_super_admins(userId,active,createdAt) VALUES(?,1,?)').run(userId, now);
      this.audit(null, userId, 'SuperAdminBootstrapped', now);
      return {userId, role: 'SuperAdmin'};
    });
  }
  provision(input) {
    return transaction(this.db, () => this.#provision(input));
  }
  // Service-only onboarding foundation. No public HTTP endpoint is exposed yet.
  provisionNewMaster(input) {
    return transaction(this.db, () => {
      this.requireSuperAdmin(input.actorUserId);
      const email = text(input.masterAdminEmail, 'email', 200).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reject('invalid-input', 'Invalid email');
      // Never claim an existing identity, including a disabled or pending one.
      if (this.db.prepare('SELECT id FROM users WHERE lower(email)=?').get(email)) reject('invalid-user', 'Use the existing-account invitation workflow');
      const userId = randomUUID(), now = this.now();
      this.db.prepare("INSERT INTO users(id,name,email,role,password,active) VALUES(?,?,?,'Clerk',?,0)")
        .run(userId, email, email, randomBytes(16).toString('hex') + ':' + randomBytes(64).toString('hex'));
      this.db.prepare('INSERT INTO platform_pending_identities(userId,createdAt) VALUES(?,?)').run(userId, now);
      const result = this.#provision({...input, masterAdminUserId: userId}, true);
      this.audit(result.organisationId, input.actorUserId, 'InvitationIdentityCreated', now, {userId});
      return {...result, newAccount: true};
    });
  }
  #provision({actorUserId, name, type, timezone = 'Asia/Kolkata', masterAdminUserId, staffLimit, clientLimit, licences}, pendingIdentity = false) {
      this.requireSuperAdmin(actorUserId);
      name = text(name, 'organisation name', 160); type = text(type, 'organisation type', 80);
      timezone = text(timezone, 'timezone', 100);
      try { new Intl.DateTimeFormat('en', {timeZone: timezone}); } catch { reject('invalid-input', 'Invalid timezone'); }
      capacity(staffLimit, 1); capacity(clientLimit);
      const master = this.user(masterAdminUserId);
      if (!master || (!master.active && !pendingIdentity)) reject('invalid-user', 'Select an existing active Master Admin account');
      if (!Array.isArray(licences) || licences.length === 0 || licences.length > registry.apps.length) reject('invalid-input', 'Select private app licences');
      const seen = new Set();
      for (const licence of licences) {
        if (!licence || typeof licence !== 'object') reject('invalid-input', 'Invalid licence');
        const app = registry.apps.find(app => app.id === licence.appId && app.status === 'Available' && !app.public);
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
      this.db.prepare('INSERT INTO platform_organisations(id,name,type,timezone,status,masterAdminUserId,staffLimit,clientLimit,createdAt) VALUES(?,?,?,?,?,?,?,?,?)')
        .run(organisationId, name, type, timezone, 'PendingActivation', master.id, staffLimit, clientLimit, now);
      this.db.prepare('INSERT INTO platform_memberships(organisationId,userId,role,status,createdAt) VALUES(?,?,?,?,?)')
        .run(organisationId, master.id, 'MasterAdmin', 'Invited', now);
      for (const licence of licences) this.db.prepare('INSERT INTO platform_app_licences(organisationId,appId,status,startsAt,endsAt,readOnlyUntil,staffLimit,clientLimit) VALUES(?,?,?,?,?,?,?,?)')
        .run(organisationId, licence.appId, licence.status, licence.startsAt, licence.endsAt, licence.readOnlyUntil, licence.staffLimit, licence.clientLimit);
      const expiresAt = now + 48 * 60 * 60 * 1000;
      this.db.prepare('INSERT INTO platform_organisation_invitations(id,organisationId,userId,email,tokenHash,expiresAt,createdAt) VALUES(?,?,?,?,?,?,?)')
        .run(randomUUID(), organisationId, master.id, master.email, hash(token), expiresAt, now);
      this.audit(organisationId, actorUserId, 'OrganisationProvisioned', now, {masterAdminUserId: master.id, appIds: [...seen]});
      // One-time return to the authorised caller; never persist/log the raw token.
      return {organisationId, status: 'PendingActivation', invitation: {token, expiresAt}};
  }
  activateNewMaster({token, email, name, password}) {
    return transaction(this.db, () => {
      const invalid = () => reject('invalid-invitation', 'Invitation is invalid or unavailable');
      if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof email !== 'string') invalid();
      const invitation = this.db.prepare('SELECT * FROM platform_organisation_invitations WHERE tokenHash=?').get(hash(token));
      const now = this.now();
      if (!invitation || invitation.email !== email.trim().toLowerCase() || invitation.consumedAt !== null || invitation.revokedAt !== null || now >= invitation.expiresAt) invalid();
      const user = this.user(invitation.userId);
      const pending = this.db.prepare('SELECT * FROM platform_pending_identities WHERE userId=?').get(invitation.userId);
      const org = this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(invitation.organisationId);
      const member = this.db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(invitation.organisationId, invitation.userId);
      if (!user || user.active || user.email !== invitation.email || !pending || pending.activatedAt !== null || org?.status !== 'PendingActivation' || org.masterAdminUserId !== user.id || member?.role !== 'MasterAdmin' || member.status !== 'Invited') invalid();
      name = text(name, 'name', 120);
      if (typeof password !== 'string' || password.length < 12 || password.length > 128) reject('invalid-input', 'Use a password between 12 and 128 characters');
      const salt = randomBytes(16).toString('hex');
      const credential = salt + ':' + scryptSync(password, salt, 64).toString('hex');
      this.db.prepare('UPDATE users SET name=?,password=?,active=1 WHERE id=?').run(name, credential, user.id);
      this.db.prepare('UPDATE platform_pending_identities SET activatedAt=? WHERE userId=?').run(now, user.id);
      const result = this.#acceptInvitation({actorUserId: user.id, token});
      this.audit(org.id, user.id, 'InvitationIdentityActivated', now, {userId: user.id});
      return result;
    });
  }
  acceptInvitation({actorUserId, token}) {
    return transaction(this.db, () => this.#acceptInvitation({actorUserId, token}));
  }
  #acceptInvitation({actorUserId, token}) {
      const user = this.user(actorUserId), now = this.now();
      if (!user?.active || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) reject('invalid-invitation', 'Invitation is invalid or unavailable');
      const invitation = this.db.prepare('SELECT * FROM platform_organisation_invitations WHERE tokenHash=?').get(hash(token));
      if (!invitation || invitation.userId !== user.id || invitation.email !== user.email || invitation.consumedAt !== null || invitation.revokedAt !== null || now >= invitation.expiresAt) reject('invalid-invitation', 'Invitation is invalid or unavailable');
      const org = this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(invitation.organisationId);
      const member = this.db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(org.id, user.id);
      if (org.status !== 'PendingActivation' || org.masterAdminUserId !== user.id || member?.role !== 'MasterAdmin' || member.status !== 'Invited') reject('invalid-invitation', 'Invitation is invalid or unavailable');
      this.db.prepare('UPDATE platform_organisation_invitations SET consumedAt=? WHERE id=?').run(now, invitation.id);
      this.db.prepare("UPDATE platform_memberships SET status='Active' WHERE organisationId=? AND userId=?").run(org.id, user.id);
      this.db.prepare("UPDATE platform_organisations SET status='Active',version=version+1 WHERE id=?").run(org.id);
      this.audit(org.id, user.id, 'OrganisationActivated', now);
      return {organisationId: org.id, status: 'Active'};
  }
  updateMasterInvitation({actorUserId, organisationId, version, revokeOnly = false}) {
    return transaction(this.db, () => {
      this.requireSuperAdmin(actorUserId);
      if (!Number.isSafeInteger(version) || version < 1 || typeof revokeOnly !== 'boolean') reject('invalid-input', 'A valid revision and invitation action are required');
      const org = this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(text(organisationId, 'organisation ID', 200));
      if (!org || org.status !== 'PendingActivation') reject('invalid-state', 'Only pending organisations can update activation invitations');
      if (org.version !== version) reject('conflict', 'Organisation changed; reload before continuing');
      const user = this.user(org.masterAdminUserId);
      const pending = user && this.db.prepare('SELECT activatedAt FROM platform_pending_identities WHERE userId=?').get(user.id);
      if (!user || (!user.active && (!pending || pending.activatedAt !== null))) reject('invalid-user', 'Master Admin account is inactive');
      const now = this.now();
      this.db.prepare('UPDATE platform_organisation_invitations SET revokedAt=? WHERE organisationId=? AND userId=? AND consumedAt IS NULL AND revokedAt IS NULL').run(now, org.id, user.id);
      this.db.prepare('UPDATE platform_organisations SET version=version+1 WHERE id=?').run(org.id);
      this.audit(org.id, actorUserId, revokeOnly ? 'MasterInvitationRevoked' : 'MasterInvitationReissued', now);
      if (revokeOnly) return {organisationId: org.id, version: version + 1};
      const token = randomBytes(32).toString('hex'), expiresAt = now + 48 * 60 * 60 * 1000;
      this.db.prepare('INSERT INTO platform_organisation_invitations(id,organisationId,userId,email,tokenHash,expiresAt,createdAt) VALUES(?,?,?,?,?,?,?)')
        .run(randomUUID(), org.id, user.id, user.email, hash(token), expiresAt, now);
      return {organisationId: org.id, version: version + 1, invitation: {token, expiresAt}};
    });
  }
  organisation({actorUserId, organisationId}) {
    const org = this.db.prepare('SELECT id,name,type,timezone,status,masterAdminUserId,staffLimit,clientLimit,version,createdAt FROM platform_organisations WHERE id=?').get(text(organisationId, 'organisation ID', 200));
    if (!org) reject('forbidden', 'Organisation administration unavailable');
    const membership = this.db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(org.id, actorUserId);
    if (!canManageOrganisation({...this.authority(actorUserId), organisation: org, membership}).allowed) reject('forbidden', 'Organisation administration unavailable');
    return {...org, licences: this.db.prepare('SELECT * FROM platform_app_licences WHERE organisationId=? ORDER BY appId').all(org.id)};
  }
}
