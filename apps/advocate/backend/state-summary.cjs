// Shared derived presentation state; never writes or changes payment validation.
function summarizeState(state,today,{roundEachPayment=false}={}){
 const next=new Map(),paid=new Map();
 for(const h of state.hearings){if(h.archived||h.status!=='Scheduled'||h.date<today)continue;const current=next.get(h.caseId);if(!current||(h.date+h.time).localeCompare(current.date+current.time)<0)next.set(h.caseId,h);}
 for(const payment of state.payments)if(!payment.archived)paid.set(payment.invoiceId,(paid.get(payment.invoiceId)||0)+(roundEachPayment?Math.round(payment.amount*100):payment.amount*100));
 for(const c of state.cases)c.nextDate=next.get(c.id)?.date||'';
 for(const invoice of state.invoices){invoice.paid=Math.round(paid.get(invoice.id)||0)/100;invoice.balance=Math.round((invoice.amount-invoice.paid)*100)/100;invoice.status=invoice.balance<=0?'Paid':invoice.paid>0?'Part paid':'Unpaid';}
 return state;
}
module.exports={summarizeState};
