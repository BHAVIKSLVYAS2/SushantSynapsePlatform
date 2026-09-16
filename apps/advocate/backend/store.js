const { PlatformDatabase } = require('../../../packages/database');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { schemas, indiaToday } = require('./schema');

class Store extends PlatformDatabase {
  constructor(root) {
    super(root,{appSchema:path.join(__dirname,'../database/schema.sql')});
    if (!this.setting('firm')) this.setSetting('firm', { name: 'My Chambers', advocate: '', email: '', phone: '', address: '', barNumber: '', timezone: 'Asia/Kolkata' });
    if (!this.setting('migrated')) this.migrate();
    if (!this.setting('platform_migrated')) this.transaction(() => {
      for (const user of this.users()) this.setAccess(user.id, ['advocate']);
      this.setSetting('platform_migrated', true);
    });
  }
  all(kind) { return this.sql.prepare('SELECT data FROM records WHERE kind=? ORDER BY rowid DESC').all(kind).map(r => JSON.parse(r.data)); }
  get(kind, id) { if (kind === 'users') return this.user(id); const r = this.sql.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind, id); return r ? JSON.parse(r.data) : null; }
  put(kind, record) { this.sql.prepare('INSERT INTO records(kind,id,data) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data').run(kind, record.id, JSON.stringify(record)); return record; }
  create(kind, record) { const now = new Date().toISOString(); return this.put(kind, { ...record, id: record.id || randomUUID(), version: 1, archived: false, createdAt: now, updatedAt: now }); }
  file(id) { return this.sql.prepare('SELECT * FROM files WHERE id=?').get(id); }
  addFile(id, name, mime, content) { this.sql.prepare('INSERT INTO files VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,mime=excluded.mime,content=excluded.content').run(id, name, mime, content); }
  state() {
    const result = { settings: this.setting('firm'), users: this.users(), activity: this.activity() };
    for (const kind of Object.keys(schemas)) result[kind] = this.all(kind);
    for (const c of result.cases) {
      c.nextDate = result.hearings.filter(h => !h.archived && h.caseId === c.id && h.status === 'Scheduled' && h.date >= indiaToday()).sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0]?.date || '';
    }
    for (const i of result.invoices) {
      i.paid = Math.round(result.payments.filter(p => !p.archived && p.invoiceId === i.id).reduce((sum,p) => sum + p.amount * 100, 0)) / 100;
      i.balance = Math.round((i.amount - i.paid) * 100) / 100;
      i.status = i.balance <= 0 ? 'Paid' : i.paid > 0 ? 'Part paid' : 'Unpaid';
    }
    return result;
  }
  backup() {
    const records = {}; for (const kind of Object.keys(schemas)) records[kind] = this.all(kind);
    return { format: 'chambers-backup', version: 2, exportedAt: new Date().toISOString(), settings: this.setting('firm'), records,
      files: this.sql.prepare('SELECT * FROM files').all().map(f => ({ ...f, content: Buffer.from(f.content).toString('base64') })) };
  }
  exportSql() {
    const literal = value => value === null ? 'NULL' : value instanceof Uint8Array ? "X'" + Buffer.from(value).toString('hex') + "'" : typeof value === 'number' ? String(value) : "CAST(X'" + Buffer.from(String(value),'utf8').toString('hex') + "' AS TEXT)";
    const lines = ['-- Chambers full SQLite export. Import into a NEW, empty database.', '-- Includes account password hashes, audit records and documents; excludes live sessions.', '-- Exported '+new Date().toISOString(), this.schemaSql, 'BEGIN TRANSACTION;'];
    for (const table of ['users','app_access','platform_preferences','records','files','settings','audit',...(this.extraExportTables||[])]) {
      for (const row of this.sql.prepare(`SELECT * FROM ${table}`).all()) {
        lines.push(`INSERT INTO ${table} (${Object.keys(row).map(k=>'"'+k+'"').join(', ')}) VALUES (${Object.values(row).map(literal).join(', ')});`);
      }
    }
    lines.push('COMMIT;');
    return lines.join('\n');
  }
  snapshot(force = false) {
    const dir = path.join(this.root, 'backups'); fs.mkdirSync(dir, { recursive: true });
    const name = force ? `before-restore-${Date.now()}.json` : `daily-${indiaToday()}.json`;
    const target = path.join(dir, name);
    if (!fs.existsSync(target)) fs.writeFileSync(target, JSON.stringify(this.backup()), { mode: 0o600 });
  }
  migrate() {
    const file = path.join(this.root, 'records.json');
    this.transaction(() => {
      if (fs.existsSync(file)) {
        const old = JSON.parse(fs.readFileSync(file, 'utf8'));
        const clients = old.clients || [];
        const clientId = name => {
          let client = clients.find(c => c.name === name);
          if (!client) { client = { id: randomUUID(), name: name || 'Unspecified client' }; clients.push(client); }
          return client.id;
        };
        for (const c of old.cases || []) { this.create('cases', { ...c, clientId: clientId(c.client), assigneeId: '', filingDate: '', petitioner: '', respondent: '', acts: '' }); }
        for (const c of clients) this.create('clients', { ...c, type: 'Individual', address: '', contactPerson: '' });
        for (const t of old.tasks || []) this.create('tasks', { ...t, status: t.done ? 'Done' : 'To do', notes: '', assigneeId: '' });
        for (const h of old.hearings || []) this.create('hearings', { ...h, purpose: h.purpose || 'Hearing', status: h.outcome ? 'Completed' : 'Scheduled', assigneeId: '' });
        for (const c of old.cases || []) if (c.nextDate && !(old.hearings || []).some(h => h.caseId === c.id && h.date === c.nextDate)) this.create('hearings', { caseId: c.id, date: c.nextDate, time: '10:00', purpose: 'Migrated next hearing — confirm time', status: 'Scheduled', outcome: '', courtroom: '', assigneeId: '' });
        for (const i of old.invoices || []) {
          const cid = clientId(i.client); if (!this.get('clients', cid)) this.create('clients', { ...clients.find(c=>c.id===cid), type:'Individual' });
          this.create('invoices', { ...i, clientId: cid, caseId: '', date: i.due, notes: '', number: 'INV-' + i.id.toUpperCase() });
          if (i.status === 'Paid') this.create('payments', { invoiceId: i.id, amount: i.amount, date: i.due, method: 'Other', reference: 'Migrated payment', notes: '' });
        }
        for (const d of old.documents || []) {
          const match = /^data:([^;]*);base64,(.+)$/.exec(d.content || '');
          const { content, ...meta } = d;
          if (match) { const bytes = Buffer.from(match[2], 'base64'); this.addFile(d.id, d.name, match[1], bytes); this.create('documents', { ...meta, category: 'Other', size: bytes.length, originalName: d.name, notes: '' }); }
        }
      }
      this.setSetting('migrated', true);
    });
  }
  demo() {
    if (this.all('cases').length || this.all('clients').length) return;
    const day = offset => { const d = new Date(indiaToday()+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+offset); return d.toISOString().slice(0,10); };
    const people = ['Arjun Mehta', 'Kavita Sharma', 'Aster Technologies', 'Rohan Kapoor'];
    const matters = ['Mehta v. Skyline Developers', 'Kavita Sharma v. State', 'Aster Technologies — Contract dispute', 'Rohan Kapoor — Settlement'];
    people.forEach((name, i) => {
      const client = this.create('clients', { name, type: i===2?'Organisation':'Individual', email: `client${i+1}@example.com`, phone:'', address:'New Delhi', notes:'Fictional demonstration client', contactPerson:'' });
      const c = this.create('cases', { title:matters[i], clientId:client.id, number:`CS/${284+i}/2026`, cnr:'', court:i%2?'Saket District Court':'Delhi High Court', type:['Civil','Criminal','Commercial','Family'][i], stage:['Arguments','Evidence','Pleadings','Mediation'][i], status:'Active', assigneeId:'', notes:'Demonstration matter. Replace with your own records.', filingDate:day(-30), petitioner:name, respondent:'', acts:'' });
      this.create('hearings', {caseId:c.id,date:day(i),time:i%2?'12:00':'10:30',purpose:['Final arguments','Evidence','Pleadings','Mediation'][i],courtroom:`Court ${i+1}`,status:'Scheduled',outcome:'',assigneeId:''});
      this.create('tasks', {title:['Prepare written submissions','Review witness statements','Review contract documents','Draft settlement terms'][i],caseId:c.id,due:day(i-1),priority:i<2?'High':'Normal',status:'To do',notes:'',assigneeId:''});
      if(i<2)this.create('invoices',{clientId:client.id,caseId:c.id,number:`INV-000${i+1}`,description:'Professional fees',amount:25000+i*10000,date:day(-10),due:day(7),notes:''});
    });
  }
}
module.exports = { Store };
