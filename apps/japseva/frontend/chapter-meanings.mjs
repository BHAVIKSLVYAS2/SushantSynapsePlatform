import entries from './chapter-meanings-data.mjs';
import {fingerprint} from './canonical-content.mjs';

// Exact source spans, never positional guesses or recycled chapter summaries.
export function validateChapterMapping(chapter,entry){
 if(!entry||entry.sourceText!==chapter.text||entry.sourceLength!==chapter.text.length||!Array.isArray(entry.pairs)||!entry.pairs.length)return false;
 let cursor=0;
 for(const pair of entry.pairs){if(!Number.isInteger(pair.start)||!Number.isInteger(pair.end)||pair.start!==cursor||pair.end<=pair.start||pair.end>chapter.text.length||typeof pair.hi!=='string'||!pair.hi.trim())return false;cursor=pair.end;}
 return cursor===chapter.text.length;
}
export function chapterMeaningPairs(chapter){
 const entry=entries[fingerprint(chapter.text)];
 if(!validateChapterMapping(chapter,entry))return null;
 return entry.pairs.map(pair=>({sanskrit:chapter.text.slice(pair.start,pair.end),meaning:{hi:pair.hi},reviewStatus:'ai-assisted'}));
}
export const cleanReadingText=text=>text.replace(/^thumb\|[^\n]*(?:\n|$)/gm,'').replace(/^_+\s*$/gm,'');
