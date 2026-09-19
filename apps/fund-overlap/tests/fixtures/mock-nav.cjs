// Explicit preload only for the isolated browser-test child process.
const originalFetch=global.fetch;
global.fetch=async function(url,options){
 if(String(url)==='https://api.mfapi.in/mf/118955')return Response.json({status:'SUCCESS',meta:{scheme_code:118955,scheme_name:'Example Portfolio Direct Growth'},data:[{date:'01-01-2024',nav:'20'},{date:'01-01-2023',nav:'10'}]});
 return originalFetch(url,options);
};
