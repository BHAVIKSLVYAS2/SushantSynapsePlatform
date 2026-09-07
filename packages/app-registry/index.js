// App definitions are code-reviewed. Do not accept launch URLs from user input.
const apps = [
  { id: 'fund-overlap', name: 'Fund Lens', subtitle: 'Mutual fund overlap analyzer', category: 'Investing', status: 'Available', path: '/fund-overlap', icon: 'lens', accent: 'blue', description: 'See what your funds have in common. Compare equity holdings, industries and unique contributions using official portfolio disclosures.', features: ['Holdings overlap', 'Industry comparison', 'What-if analysis'] },
  { id: 'advocate', name: 'Chambers', subtitle: 'Advocate workspace', category: 'Legal', status: 'Available', path: '/advocate', icon: 'scales', accent: 'green', description: 'Cases, clients, hearings and professional fees. Your entire legal practice, in good order.', features: ['Case management', 'Hearing diary', 'Fees & payments'] },
  { id: 'projects', name: 'Projects', subtitle: 'Plan the work ahead', category: 'Productivity', status: 'Planned', icon: 'projects', accent: 'violet', description: 'A future workspace for projects, milestones and team tasks.', features: ['Projects', 'Milestones'] },
  { id: 'finance', name: 'Finance', subtitle: 'Clarity for your business', category: 'Business', status: 'Planned', icon: 'finance', accent: 'amber', description: 'A future app for business income, expenses and financial reporting.', features: ['Income & expenses', 'Reports'] },
  { id: 'knowledge', name: 'Knowledge', subtitle: 'Keep good ideas together', category: 'Productivity', status: 'Planned', icon: 'knowledge', accent: 'blue', description: 'A future home for notes, references and shared knowledge.', features: ['Notes', 'Collections'] },
];
module.exports = { apps };
