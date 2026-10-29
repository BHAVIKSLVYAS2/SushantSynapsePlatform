const {Readable}=require('node:stream'),fs=require('node:fs'),path=require('node:path');
function createPanditBooking({store,auth}){
 store.registerAppSchema('pandit-booking',fs.readFileSync(path.join(__dirname,'../database/001-initial.sql'),'utf8'),['pandit_booking_workspaces']);
 const buckets=new Map();
 return async(req,res,origin)=>{
  if(store.provider!=='sqlite')throw Object.assign(Error('Pandit Booking requires SQLite or Workers/D1'),{status:503});
  if(process.env.ORG_ADMIN_PREVIEW==='1')throw Object.assign(Error('Pandit Booking Node organisation preview is unavailable; use the isolated Workers preview'),{status:503});
  const {bookingApi}=await import('./service.mjs'),{hasAppAccess}=auth,user=auth.session(req);
  const role=u=>u?.role==='Owner'?'Owner':u?.role==='Advocate'?'Pandit':'Customer';
  const grant=async org=>{if(!user)throw Object.assign(Error('Please sign in'),{status:401});if(org!=='local'||!hasAppAccess(user,'pandit-booking'))throw Object.assign(Error('Booking app access required'),{status:403});return {actor:{id:user.id,name:user.name,role:role(user)},organisation:{name:'Local booking workspace'},readOnly:false};};
  const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Readable.toWeb(req),duplex:'half'}:{})});
  const response=await bookingApi(request,{
   user,grant,
   organisations:async()=>{try{await grant('local');return [{id:'local',name:'Local booking workspace',role:role(user)}];}catch{return [];}},
   publicOperators:async()=>store.sql.prepare("SELECT 1 FROM pandit_booking_workspaces WHERE organisationId='local'").get()?[{id:'local',name:'Local booking workspace'}]:[],
   publicEnabled:async org=>org==='local',
   publicLimit:async()=>{
    const minute=Math.floor(Date.now()/60000),key='public:'+req.socket.remoteAddress;
    for(const [id,b]of buckets)if(b.minute!==minute)buckets.delete(id);
    if(!buckets.has(key)){if(buckets.size>=1000)return {success:false};buckets.set(key,{minute,count:0});}
    return {success:++buckets.get(key).count<=60};
   },
   eligible:async()=>new Map(store.users().filter(u=>u.active&&hasAppAccess(u,'pandit-booking')).map(u=>[u.id,role(u)])),
   read:async org=>{const row=store.sql.prepare('SELECT data FROM pandit_booking_workspaces WHERE organisationId=?').get(org);return row?JSON.parse(row.data):null;},
   write:async(org,next,version)=>store.transaction(()=>{
    const current=auth.session(req);
    if(!current||current.id!==user.id||role(current)!==role(user)||!hasAppAccess(current,'pandit-booking'))throw Object.assign(Error('Booking access changed. Please sign in again.'),{status:403});
    const row=store.sql.prepare('SELECT version FROM pandit_booking_workspaces WHERE organisationId=?').get(org);
    if((row?.version||0)!==version)throw Object.assign(Error('Booking workspace changed. Refresh.'),{status:409});
    const previous=store.sql.prepare('SELECT data FROM pandit_booking_workspaces WHERE organisationId=?').get(org);
    const before=previous?JSON.parse(previous.data).bookings:[];
    for(const booking of next.bookings){
     const old=before.find(b=>b.id===booking.id);
     if(['Requested','Confirmed'].includes(booking.status)&&(!old||old.status!==booking.status||old.start!==booking.start||old.end!==booking.end)){
      for(const [id,required]of [[booking.panditId,'Pandit'],[booking.customerId,'Customer']]){
       const participant=store.user(id);
       if(!participant?.active||role(participant)!==required||!hasAppAccess(participant,'pandit-booking'))throw Object.assign(Error('Booking participant access changed. Refresh.'),{status:409});
      }
     }
    }
    store.sql.prepare('INSERT INTO pandit_booking_workspaces VALUES(?,?,?) ON CONFLICT(organisationId) DO UPDATE SET version=excluded.version,data=excluded.data').run(org,next.version,JSON.stringify(next));
   }),
   limit:async id=>{
    const minute=Math.floor(Date.now()/60000);for(const [key,b]of buckets)if(b.minute!==minute)buckets.delete(key);
    if(!buckets.has(id)){if(buckets.size>=1000)return {success:false};buckets.set(id,{minute,count:0});}
    return {success:++buckets.get(id).count<=30};
   }
  });
  if(user&&new URL(req.url,origin).pathname==='/api/pandit-booking/local'){
   const current=auth.session(req);
   if(!current||current.id!==user.id||role(current)!==role(user)||!hasAppAccess(current,'pandit-booking'))throw Object.assign(Error('Booking access changed. Please sign in again.'),{status:403});
  }
  for(const [key,value]of response.headers)res.setHeader(key,value);res.writeHead(response.status);res.end(Buffer.from(await response.arrayBuffer()));
 };
}
module.exports={createPanditBooking};
