// Browser verification must not produce live advertising traffic or impressions.
async function interceptAds(context){
 await context.route('https://pagead2.googlesyndication.com/**',route=>route.fulfill({contentType:'text/javascript',body:''}));
}
async function noAdsContext(browser,options){
 const context=await browser.newContext(options);await interceptAds(context);return context;
}
module.exports={interceptAds,noAdsContext};
