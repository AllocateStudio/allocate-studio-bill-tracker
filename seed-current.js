/* One-time sample insertion requested for the main calendar. */
'use strict';
function addSamplesToCurrentCalendar(){
  if(state.sampleDataAdded===1||storageLoadFailed)return;
  const original=state;
  try{
    protectData('Before adding sample bills and income');
    const sample=window.createBillCalendarDemo(),ids=new Set(state.bills.map(b=>b.id));
    const added=sample.bills.filter(b=>!ids.has(b.id));
    const overrides={...state.paymentOverrides};
    for(const b of added){const key=b.id+':'+b.firstDate;if(sample.paymentOverrides[key])overrides[key]=sample.paymentOverrides[key];}
    state={...state,bills:[...state.bills,...added],paymentOverrides:overrides,sampleDataAdded:1};
    validateState(state);
    if(!saveState()){state=original;render();toast(storageIssue);return;}
    render();toast('Sample bills and income added');
  }catch(e){state=original;toast(e.message||'Sample data could not be added.');}
}
document.addEventListener('DOMContentLoaded',addSamplesToCurrentCalendar);
