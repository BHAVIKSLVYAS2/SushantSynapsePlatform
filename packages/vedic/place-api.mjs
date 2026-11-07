// Public, read-only directory lookup. No database or GPS coordinates are used.
import {getPlace,searchPlaces} from './places.mjs';
export function placeLookup(url,method='GET'){
 if(!['GET','HEAD'].includes(method))return {status:405,body:{error:'Method not allowed'}};
 if([...url.searchParams.keys()].some(key=>!['q','id','limit'].includes(key)))return {status:400,body:{error:'Unsupported search parameter'}};
 if([...url.searchParams.keys()].some(key=>url.searchParams.getAll(key).length!==1))return {status:400,body:{error:'Repeated search parameter'}};
 try{
  const id=url.searchParams.get('id'),q=url.searchParams.get('q');
  if(id!==null){if(q!==null||url.searchParams.has('limit'))throw Error();return {status:200,body:{place:getPlace(id)}};}
  if(q===null||q.length<2||q.length>100)throw Error();
  const limit=url.searchParams.has('limit')?Number(url.searchParams.get('limit')):8;
  return {status:200,body:searchPlaces(q,{limit})};
 }catch{return {status:400,body:{error:'Choose a supported city or enter a valid search (2–100 characters).'}};}
}
export function placeResponse(request){
 const {status,body}=placeLookup(new URL(request.url),request.method);
 return new Response(request.method==='HEAD'?null:JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':status===200?'public, max-age=86400':'no-store','X-Content-Type-Options':'nosniff',...(status===405?{Allow:'GET, HEAD'}:{})}});
}
