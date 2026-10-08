/* RECURRENCE ENGINE · PAYMENT STATUS · MONTH STATS
   Frequency stepping and date math ported from Allocate Studio Ultimate Budget's engine.js
   (STEPS / addMonths / addDays / generateRecurringTransactions), adapted for single-bill payments. */
(function(root){
  'use strict';
  const STEPS={'Weekly':7,'Every 2 Weeks':14,'Every 4 Weeks':28,'Monthly':-1,'Every 2 Months':-2,'Every 3 Months':-3,'Every 6 Months':-6,'Yearly':-12};
  const date=s=>new Date(s+'T12:00:00Z');
  const iso=d=>d.toISOString().slice(0,10);
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  function addMonths(s,n){const d=date(s),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n);const end=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,end));return iso(d);}
  function addDays(s,n){const d=date(s);d.setUTCDate(d.getUTCDate()+n);return iso(d);}
  function daysInMonth(year,month){return new Date(Date.UTC(year,month+1,0)).getUTCDate();}
  function startOfMonth(month){return month+'-01';}
  function endOfMonth(month){const [y,m]=month.split('-').map(Number);return `${month}-${String(daysInMonth(y,m-1)).padStart(2,'0')}`;}
  function addMonthKey(month,n){return addMonths(month+'-01',n).slice(0,7);}
  // Monday-first (or Sunday-first) index of the weekday for a date, 0..6.
  function weekdayIndex(dateStr,weekStartsOn){const jsDay=date(dateStr).getUTCDay();const mondayFirst=(jsDay+6)%7;return weekStartsOn==='Sunday'?jsDay:mondayFirst;}
  function startOfWeek(dateStr,weekStartsOn){return addDays(dateStr,-weekdayIndex(dateStr,weekStartsOn));}

  // Expand every recurring bill into its individual due dates within [from, to]. One-Time bills contribute a single date.
  function generatePayments(bills,from,to,includeArchivedFuture=false){
    const result=[];
    for(const bill of bills){
      if(!bill.firstDate)continue;
      const visibleFrom=bill.activeFrom&&bill.activeFrom>from?bill.activeFrom:from;
      const stop=bill.archived&&!includeArchivedFuture&&bill.archiveDate<to?bill.archiveDate:to;
      if(bill.frequency==='One-Time'){
        if(bill.firstDate>=visibleFrom&&bill.firstDate<=stop&&(!bill.lastDate||bill.firstDate<=bill.lastDate))result.push({id:`${bill.id}:${bill.firstDate}`,billId:bill.id,date:bill.firstDate,name:bill.name,category:bill.category,amount:bill.amount,type:bill.type||'bill'});
        continue;
      }
      const step=STEPS[bill.frequency];if(!step)continue;
      let n=0;
      if(bill.firstDate<from){
        const a=date(bill.firstDate),b=date(from);
        n=step>0?Math.max(0,Math.floor((b-a)/86400000/step)-1):Math.max(0,Math.floor(((b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth())/(-step))-1);
      }
      for(;n<100000;n++){
        const day=step>0?addDays(bill.firstDate,n*step):addMonths(bill.firstDate,n*(-step));
        if(day>stop||(bill.lastDate&&day>bill.lastDate))break;
        if(day<visibleFrom)continue;
        result.push({id:`${bill.id}:${day}`,billId:bill.id,date:day,name:bill.name,category:bill.category,amount:bill.amount,type:bill.type||'bill'});
      }
    }
    return result.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  }

  // Apply paid/adjusted overrides and derive status, same shape as the Budget app's calculatePayments().
  function calculatePayments(bills,paymentOverrides,from,to,asOf=today()){
    const generated=generatePayments(bills,from,to,true), ids=new Set(generated.map(p=>p.id));
    // Include occurrences moved into this range from another month.
    for(const [id,o] of Object.entries(paymentOverrides)){
      if(ids.has(id)||!o.date||o.date<from||o.date>to)continue;
      const bill=bills.find(b=>id.startsWith(b.id+':'));
      if(!bill)continue;
      const original=id.slice(-10),p=generatePayments([bill],original,original,true).find(p=>p.id===id);
      if(p)generated.push(p);
    }
    return generated.map(p=>{
      const o=paymentOverrides[p.id]||{};
      const effective={...p,date:o.date??p.date,amount:o.amount??p.amount,paid:!!o.paid};
      effective.status=effective.paid?'Paid':effective.date<asOf?'Overdue':'Upcoming';
      return effective;
    }).filter(p=>{const bill=bills.find(b=>b.id===p.billId);return p.date>=from&&p.date<=to&&(!bill.archived||p.paid||p.date<=bill.archiveDate);}).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  }

  function nextDueDate(bill,asOf=today()){
    if(bill.archived)return null;
    const occurrences=generatePayments([bill],asOf<bill.firstDate?bill.firstDate:asOf,addMonths(asOf,36));
    return occurrences[0]?.date||null;
  }

  function monthStats(payments,month){return periodStats(payments,startOfMonth(month),endOfMonth(month));}

  function periodStats(payments,from,to){
    const inMonth=payments.filter(p=>p.type!=='income'&&p.date>=from&&p.date<=to);
    const total=inMonth.reduce((n,p)=>n+Math.round(Number(p.amount||0)*100),0)/100;
    const paid=inMonth.filter(p=>p.paid).reduce((n,p)=>n+Math.round(Number(p.amount||0)*100),0)/100;
    const overdue=inMonth.filter(p=>p.status==='Overdue').reduce((n,p)=>n+Math.round(Number(p.amount||0)*100),0)/100;
    const remaining=Math.round((total-paid)*100)/100;
    return {total,paid,remaining,overdue,progress:total?paid/total:0};
  }

  function filterPayments(payments,filter='all'){
    if(filter==='unpaid')return payments.filter(p=>!p.paid);
    if(filter==='overdue')return payments.filter(p=>p.status==='Overdue');
    return payments;
  }

  function nextSevenDays(bills,overrides,asOf=today()){
    const to=addDays(asOf,6);
    const payments=calculatePayments(bills,overrides,asOf,to,asOf).filter(p=>p.type!=='income'&&!p.paid);
    return {from:asOf,to,count:payments.length,total:payments.reduce((sum,p)=>sum+Math.round(p.amount*100),0)/100};
  }

  // Split a recurrence at an original occurrence date; earlier IDs remain stable.
  // Returns a new state so validation/save failures cannot partially mutate history.
  function editFollowing(data,billId,from,changes,newId){
    const result=JSON.parse(JSON.stringify(data)),old=result.bills.find(b=>b.id===billId);
    if(old?.archived)throw Error('Restore this archived schedule before changing future payments.');
    if(!old||!generatePayments([old],from,from).length)throw Error('The selected payment no longer exists. Reopen it from the calendar.');
    if(changes.firstDate<from)throw Error('For this and following payments, choose a date on or after the selected date. Use Only this payment to move it earlier.');
    const keepAnchor=changes.firstDate===from&&changes.frequency===old.frequency;
    old.seriesId=old.seriesId||old.id;
    const next={...old,...changes,id:newId,firstDate:keepAnchor?old.firstDate:changes.firstDate,activeFrom:changes.firstDate};
    const futureKeys=Object.keys(result.paymentOverrides).filter(id=>id.startsWith(billId+':')&&id.slice(-10)>=from);
    const paidKeys=futureKeys.filter(id=>result.paymentOverrides[id].paid);
    const paidConflict=()=>{
      const lastPaid=paidKeys.flatMap(id=>[id.slice(-10),result.paymentOverrides[id].date||id.slice(-10)]).sort().at(-1);
      const after=addDays(lastPaid,1);
      const nextUnprotected=after<='2199-12-31'?generatePayments([old],after,'2199-12-31')[0]:null;
      const instruction=nextUnprotected?`Open the payment dated ${nextUnprotected.date} in the calendar and choose This and following payments.`:`Add a new schedule starting after ${lastPaid}.`;
      return Error(`Paid payments are protected through ${lastPaid}. Changing the frequency, moving the schedule or ending it here would affect them. ${instruction} Nothing has been changed.`);
    };
    // Paid occurrences never follow an ordinal position into a different schedule.
    if(!keepAnchor&&paidKeys.length)throw paidConflict();
    const oldDates=generatePayments([old],from,futureKeys.length?futureKeys.map(id=>id.slice(-10)).sort().at(-1):from);
    const newDates=generatePayments([next],next.activeFrom,'2199-12-31');
    const newByDate=new Map(newDates.map(p=>[p.date,p]));
    if(paidKeys.some(id=>!newByDate.has(id.slice(-10))))throw paidConflict();
    if(!newDates.length)throw Error('The new schedule has no payments. Check its dates.');
    for(const key of futureKeys){
      const index=oldDates.findIndex(p=>p.id===key);
      if(index<0)throw Error('An existing payment adjustment no longer matches this schedule. Restore its schedule before editing.');
      const override=result.paymentOverrides[key];
      const target=override.paid?newByDate.get(oldDates[index].date):newDates[index];
      if(!target)throw Error('This end date would remove a paid or adjusted payment. Choose a later end date.');
      // Amount-only edits keep every paid occurrence at its original date and amount.
      result.paymentOverrides[target.id]=override.paid?{...override,date:override.date||oldDates[index].date,amount:override.amount??oldDates[index].amount}:override;
      delete result.paymentOverrides[key];
    }
    // The selected occurrence follows the values explicitly entered in the form.
    const selectedId=newDates[0].id;
    if(result.paymentOverrides[selectedId]&&!result.paymentOverrides[selectedId].paid)result.paymentOverrides[selectedId]={...result.paymentOverrides[selectedId],date:changes.firstDate,amount:changes.amount};
    const prior=generatePayments([old],old.activeFrom||old.firstDate,addDays(from,-1));
    if(prior.length){old.lastDate=addDays(from,-1);old.history=true;}
    else result.bills=result.bills.filter(b=>b.id!==billId);
    result.bills.push(next);
    return result;
  }

  root.BillEngine={editFollowing,filterPayments,nextSevenDays,STEPS,today,addDays,addMonths,addMonthKey,daysInMonth,startOfMonth,endOfMonth,startOfWeek,weekdayIndex,generatePayments,calculatePayments,nextDueDate,monthStats,periodStats};
})(typeof window!=='undefined'?window:globalThis);
