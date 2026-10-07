// Verified previous names for discovery only; never substitute holdings identities.
const renamedFunds = [
  {name: 'HDFC Large Cap Fund', previousNames: ['HDFC Top 100 Fund', 'HDFC Top 200 Fund'], sources: ['https://portal.amfiindia.com/spages/873.pdf', 'https://files.hdfcfund.com/ImpDocs/2_HDFC_Top_200_Fund.pdf']},
  {name: 'SBI Large Cap Fund', previousNames: ['SBI Bluechip Fund'], sources: ['https://www.sbimf.com/docs/default-source/scheme-factsheets/sbi-blue-chip-fund-factsheet-august-2025.pdf?sfvrsn=d1496a6e_2']},
];
function matchesWords(name, words) {
  const tokens = name.toLowerCase().replace(/\bbluechip\b/g, 'blue chip').match(/[a-z0-9]+/g) || [];
  return words.every(word => {
    const term = word.replace(/[^a-z0-9]/g, '');
    if (!term) return true;
    if (/^\d+$/.test(term)) return tokens.includes(term);
    // Prefixes and joined words support "flexi"/"flexicap" without matching
    // "top" inside "October" or "100" inside a historical "1001D" scheme.
    return tokens.some((token, i) => token.startsWith(term) || tokens.slice(i, i + 3).join('').startsWith(term));
  });
}
module.exports = {renamedFunds, matchesWords};
