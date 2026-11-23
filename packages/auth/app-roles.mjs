// Assignment vocabulary shared by administration and account navigation.
// This is not a permission engine: app commands, record scope, licences, active
// memberships and client-portal entitlements retain their separate checks.
const role=(id,description,memberType='Staff')=>Object.freeze({id,description,memberType});
const catalogue=Object.freeze({
 advocate:Object.freeze([
  role('Clerk','Work with chamber records using the existing Clerk permissions.'),
  role('Advocate','Work with cases and hearings using the existing Advocate permissions.'),
  role('Owner','Manage Chambers, including its owner-only settings and recovery controls.')
 ]),
 'batchfee-lite':Object.freeze([
  role('Viewer','View academy records and reports without making changes.'),
  role('Collector','View academy records and record fee payments.'),
  role('Manager','Manage students, batches, charges, payments, expenses and reminder templates.'),
  role('Owner','Manage the academy, including settings, corrections and backup recovery.')
 ]),
 'digital-samaj':Object.freeze([
  role('Member','Enter the community subject to separate community grants and privacy rules.'),
  role('Owner','Set up community access; community grants and privacy rules still apply.')
 ]),
 'pandit-booking':Object.freeze([
  role('Customer','Request and track your own bookings.','Client'),
  role('Pandit','Manage your provider profile, availability and confirmed bookings.'),
  role('Dispatcher','Manage booking requests and scheduling without profile-approval authority.'),
  role('Reviewer','Review provider profiles and customer reviews without booking-dispatch authority.'),
  role('Owner','Operate the booking workspace, including services, approvals and scheduling.')
 ])
});
export const assignmentAppIds=Object.freeze(Object.keys(catalogue));
const staffMemberships=new Set(['MasterAdmin','Administrator','Staff']);
export function assignmentRoles(appId,membershipRole){
 const roles=Object.hasOwn(catalogue,appId)?catalogue[appId]:[];
 if(membershipRole===undefined)return roles;
 const memberType=membershipRole==='Client'?'Client':staffMemberships.has(membershipRole)?'Staff':null;
 return roles.filter(role=>role.memberType===memberType);
}
export function isAssignmentRole(appId,role){return assignmentRoles(appId).some(entry=>entry.id===role);}
export function isMembershipAppRole(appId,role,membershipRole){
 return membershipRole!==undefined&&assignmentRoles(appId,membershipRole).some(entry=>entry.id===role);
}
