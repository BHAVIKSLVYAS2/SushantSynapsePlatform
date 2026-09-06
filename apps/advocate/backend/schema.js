const field = (label, type = 'text', extra = {}) => ({ label, type, ...extra });
const required = (label, type = 'text', extra = {}) => field(label, type, { required: true, ...extra });
const choice = (label, choices) => field(label, 'select', { choices, default: choices[0] });
const ref = (label, collection, needed = false) => field(label, 'reference', { collection, required: needed });
const schemas = {
  clients: { label: 'client', fields: {
    name: required('Client name'), type: choice('Client type', ['Individual', 'Organisation']), email: field('Email', 'email'), phone: field('Phone', 'tel'),
    address: field('Address', 'textarea'), contactPerson: field('Contact person'), notes: field('Notes', 'textarea'),
  } },
  cases: { label: 'case', fields: {
    title: required('Matter title'), clientId: ref('Client', 'clients', true), number: field('Case number'), cnr: field('CNR number'),
    court: required('Court / tribunal'), courtroom: field('Courtroom'), judge: field('Judge'),
    type: choice('Practice area', ['Civil', 'Criminal', 'Commercial', 'Family', 'Constitutional', 'Labour', 'Consumer', 'Revenue', 'Other']),
    stage: choice('Stage', ['Filing', 'Pleadings', 'Evidence', 'Arguments', 'Mediation', 'Judgment', 'Execution', 'Appeal']),
    status: choice('Status', ['Active', 'Pending', 'Closed']), filingDate: field('Filing date', 'date'),
    petitioner: field('Petitioner / complainant'), respondent: field('Respondent / opposite party'), opposingCounsel: field('Opposing counsel'),
    acts: field('Acts / sections'), assigneeId: ref('Responsible advocate', 'users'), notes: field('Case summary', 'textarea'),
  } },
  hearings: { label: 'hearing', fields: {
    caseId: ref('Case', 'cases', true), date: required('Hearing date', 'date'), time: required('Time (IST)', 'time'),
    purpose: required('Purpose'), courtroom: field('Courtroom'), judge: field('Judge'),
    assigneeId: ref('Attending advocate', 'users'), status: choice('Status', ['Scheduled', 'Completed', 'Adjourned', 'Cancelled']),
    outcome: field('Outcome / order notes', 'textarea'),
  } },
  tasks: { label: 'task', fields: {
    title: required('Task title'), caseId: ref('Case', 'cases'), due: required('Due date', 'date'),
    priority: choice('Priority', ['Normal', 'High', 'Urgent']), status: choice('Status', ['To do', 'In progress', 'Done']),
    assigneeId: ref('Assigned to', 'users'), notes: field('Details', 'textarea'),
  } },
  notes: { label: 'note', fields: {
    title: required('Title'), caseId: ref('Case', 'cases', true), type: choice('Entry type', ['Case note', 'Client call', 'Meeting', 'Email record', 'Court order']),
    date: required('Date', 'date'), body: required('Notes / communication record', 'textarea'),
  } },
  documents: { label: 'document', fields: {
    name: required('Document name'), caseId: ref('Case', 'cases', true),
    category: choice('Category', ['Petition', 'Order', 'Evidence', 'Agreement', 'Correspondence', 'Other']), notes: field('Notes', 'textarea'),
  } },
  invoices: { label: 'invoice', fields: {
    clientId: ref('Client', 'clients', true), caseId: ref('Case', 'cases'), description: required('Fee description'),
    amount: required('Amount (INR)', 'money'), date: required('Issue date', 'date'), due: required('Due date', 'date'), notes: field('Notes', 'textarea'),
  } },
  payments: { label: 'payment', fields: {
    invoiceId: ref('Invoice', 'invoices', true), amount: required('Payment amount (INR)', 'money'), date: required('Payment date', 'date'),
    method: choice('Payment method', ['Bank transfer', 'UPI', 'Cash', 'Cheque', 'Other']), reference: field('Reference / transaction ID'), notes: field('Notes', 'textarea'),
  } },
  expenses: { label: 'expense', fields: {
    description: required('Description'), caseId: ref('Case', 'cases'), amount: required('Amount (INR)', 'money'), date: required('Expense date', 'date'),
    category: choice('Category', ['Court fee', 'Travel', 'Printing', 'Professional', 'Office', 'Other']),
    billable: field('Recoverable from client', 'checkbox', { default: false }), notes: field('Notes', 'textarea'),
  } },
};
const indiaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value && value >= '1900-01-01' && value <= '2200-12-31';
}
function validate(kind, input, previous = {}, lookup) {
  const schema = schemas[kind];
  if (!schema) throw Error('Unknown record type');
  const record = {};
  for (const [key, f] of Object.entries(schema.fields)) {
    let value = Object.hasOwn(input, key) ? input[key] : previous[key] ?? f.default ?? '';
    if (f.type === 'checkbox') {
      if (typeof value !== 'boolean') throw Error(`${f.label} must be true or false`);
    } else if (f.type === 'money') {
      if (typeof value !== 'number' && typeof value !== 'string') throw Error(`Invalid ${f.label}`);
      value = Number(value);
      if (!Number.isFinite(value) || value <= 0 || value > 100000000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) throw Error(`${f.label} must be positive, with at most 2 decimal places`);
      value = Math.round(value * 100) / 100;
    } else {
      if (typeof value !== 'string') throw Error(`Invalid ${f.label}`);
      value = value.trim();
      if (f.required && !value) throw Error(`${f.label} is required`);
      if (value.length > (f.type === 'textarea' ? 20000 : 500)) throw Error(`${f.label} is too long`);
      if (value && f.type === 'date' && !validDate(value)) throw Error(`Invalid ${f.label}`);
      if (value && f.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw Error('Invalid time');
      if (value && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw Error('Invalid email address');
      if (f.choices && !f.choices.includes(value)) throw Error(`Invalid ${f.label}`);
      if (value && f.type === 'reference') {
        const target = lookup(f.collection, value);
        if (!target || ((target.archived || target.active === false) && previous[key] !== value)) throw Error(`${f.label} is missing or archived`);
      }
    }
    record[key] = value;
  }
  if (kind === 'cases' && record.cnr && !/^[A-Z0-9]{16}$/.test(record.cnr)) throw Error('CNR must be 16 uppercase letters or digits');
  if (kind === 'invoices') {
    if (record.due < record.date) throw Error('Due date cannot precede issue date');
    if (record.caseId && lookup('cases', record.caseId).clientId !== record.clientId) throw Error('The selected case belongs to another client');
  }
  return record;
}
module.exports = { schemas, validate, indiaToday, validDate };
