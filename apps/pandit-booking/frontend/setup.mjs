// All progress comes from the caller's already-authorised workspace projection.
export function setupSteps(state){
 if(!state||state.role==='Visitor')return [];
 const services=state.services.some(s=>s.active),approved=state.profiles.filter(p=>p.status==='Approved');
 if(['Owner','Dispatcher'].includes(state.role))return [
  {label:'Publish a ceremony',done:services,tab:'manage'},
  {label:'Review a Pandit profile',done:approved.length>0,tab:state.role==='Owner'?'moderation':null},
  {label:'Ask the Pandit to add availability',done:approved.some(p=>p.windows.length>0)},
  {label:'Confirm the first booking',done:state.bookings.some(b=>['Confirmed','Completed','NoShow'].includes(b.status)),tab:'bookings'}
 ];
 if(state.role==='Pandit'){
  const profile=state.profiles.find(p=>p.id===state.userId);
  return [
   {label:'Ask your operator to publish a ceremony',done:services},
   {label:'Submit your profile',done:!!profile,tab:'profile'},
   {label:'Wait for operator approval',done:profile?.status==='Approved',tab:'profile'},
   {label:'Add available time slots',done:!!profile?.windows.length,tab:'profile'},
   {label:'Open a confirmed booking to chat',done:state.bookings.some(b=>b.status==='Confirmed'),tab:'bookings'}
  ];
 }
 if(state.role==='Reviewer')return [{label:'Review a Pandit profile',done:approved.length>0,tab:'moderation'}];
 return [
  {label:'Choose a published ceremony',done:services,tab:'services'},
  {label:'Find an approved Pandit with availability',done:approved.some(p=>p.windows.length>0),tab:'pandits'},
  {label:'Send your first booking request',done:state.bookings.length>0,tab:'pandits'},
  {label:'Wait for booking confirmation',done:state.bookings.some(b=>['Confirmed','Completed','NoShow'].includes(b.status)),tab:'bookings'}
 ];
}
