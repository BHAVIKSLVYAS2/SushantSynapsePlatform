const {transform}=require('lightningcss');

// Home is always the portal, including sign-in, favourites and workspace states.
// Only discard rules whose selectors all have a positive, different app scope.
// Do not inspect :not/:is/:has arguments: these can include valid alternatives.
function appCss(css,app='portal'){
 return transform({filename:'home.css',code:Buffer.from(css),visitor:{
  Rule(rule){
   if(rule.type!=='style')return;
   const selectors=rule.value.selectors.filter(selector=>!selector.some(part=>
    part.type==='attribute'&&part.name==='data-ui-app'&&
    part.operation?.operator==='equal'&&part.operation.value!==app));
   if(!selectors.length)return [];
   // Keep mixed selector lists intact, including their original specificity.
  }
 }}).code.toString();
}
const homeCss=css=>appCss(css,'portal');
module.exports={homeCss,appCss};
