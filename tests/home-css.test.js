const {test}=require('node:test');
const assert=require('node:assert/strict');
const {homeCss,appCss}=require('../infrastructure/home-css.cjs');

test('home CSS removes only rules exclusively scoped to another app',()=>{
 const css=homeCss(`
  body[data-ui-app=advocate] .sidebar { color: red }
  @media (max-width:760px) { body[data-ui-app=news] .edition { color: red } }
  body[data-ui-app=portal] .workspace-card { color: green }
  body[data-ui-app] .panel { color: blue }
  body:not([data-ui-app=advocate]) .keep-negation { color: green }
  :is(body[data-ui-app=portal],body[data-ui-app=news]) .keep-alternatives { color: green }
  body[data-ui-app=news] .edition, .keep-mixed { color: blue }
 `);
 assert.doesNotMatch(css,/sidebar|color:\s*red/);
 for(const name of ['workspace-card','panel','keep-negation','keep-alternatives','keep-mixed'])assert.ok(css.includes(name),name);
});

test('app CSS keeps its own scope, shared and mixed rules',()=>{
 const css=appCss('body[data-ui-app=news] .news{color:red} body[data-ui-app=advocate] .case{color:blue} .shared{color:green} body[data-ui-app=advocate] .case,.mixed{color:blue}','news');
 assert.ok(css.includes('.news'));assert.ok(css.includes('.shared'));assert.ok(css.includes('.mixed'));
 assert.equal((css.match(/\.case/g)||[]).length,1);
});
