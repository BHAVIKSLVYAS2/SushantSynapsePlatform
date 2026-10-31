const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('organisation and account templates receive one canonical footer without legacy duplicates',()=>{
 const {legalHtml}=require('../packages/ui/legal-html.cjs');
 for(const file of new Set(Object.values(require('../apps/admin/backend/preview-assets.cjs')).filter(f=>f.endsWith('.html')))){
  const html=legalHtml(fs.readFileSync(file,'utf8'));assert.equal((html.match(/<footer class="synapse-legal-footer"/g)||[]).length,1,file);assert.ok(html.includes('/shared/legal-footer.css'),file);assert.ok(!html.includes('class="admin-footer"'),file);assert.equal(legalHtml(html),html,file);
 }
});
test('every public layout has accessible footer language controls and an allowlisted local script',()=>{
 const {staticAssets}=require('../server/static-assets');assert.equal(staticAssets['/shared/language.js'],'packages/ui/language.js');let count=0;for(const file of [...new Set(Object.values(staticAssets))].filter(file=>file.endsWith('.html'))){const html=require('../packages/ui/legal-html.cjs').legalHtml(fs.readFileSync(file,'utf8'));if(!html.includes('synapse-legal-footer'))continue;assert.equal((html.match(/<footer class="synapse-legal-footer"[\s\S]*?<\/footer>/)?.[0].match(/data-language-control/g)||[]).length,1,file);assert.ok(html.includes('data-interface-language="en"'),file);assert.ok(html.includes('data-interface-language="hi"'),file);assert.ok(/\/shared\/language\.js(?:\?v=[^"\s]+)?" defer/.test(html),file);count++;}assert.ok(count>=32);
});

test('all shared-header pages load the canonical language service, including tools without a legal footer',()=>{
 const {staticAssets}=require('../server/static-assets'),{legalHtml}=require('../packages/ui/legal-html.cjs');let count=0;
 for(const file of new Set(Object.values(staticAssets).filter(file=>file.endsWith('.html')))){
  const source=fs.readFileSync(file,'utf8');if(!source.includes('/shared/platform-shell.js'))continue;
  const html=legalHtml(source);assert.ok(html.includes('/shared/language.js'),file);assert.equal((html.match(/src="\/shared\/language\.js[^"]*"/g)||[]).length,1,file);count++;
 }assert.ok(count>=30);
});

test('shared interface copy has complete authored Hindi and Gujarati entries',async()=>{
 const {interfaceCopy}=await import('../packages/ui/interface-copy.mjs');assert.ok(Object.keys(interfaceCopy).length>700);
 for(const [source,[hi,gu]]of Object.entries(interfaceCopy)){assert.ok(source&&hi&&gu,source);assert.match(hi,/[\u0900-\u097f]/,source);assert.match(gu,/[\u0a80-\u0aff]/,source);}
});
