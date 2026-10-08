/* Separate, editable demonstration. Real calendar storage is never read or changed. */
'use strict';
window.BILL_CALENDAR_DEMO=true;
window.createBillCalendarDemo=function(){
  const E=window.BillEngine,month=E.today().slice(0,7),day=n=>month+'-'+String(n).padStart(2,'0');
  const bill=(id,name,category,amount,date,frequency='Monthly',type='bill')=>({id,name,category,amount,firstDate:day(date),lastDate:'',frequency,type});
  const bills=[
    bill('bdemorent','Rent','Bills',1450,1),
    bill('bdemointernet','Internet','Bills',65,6),
    bill('bdemostream','Netflix','Subscriptions',15.49,9),
    bill('bdemoelectric','Electricity','Bills',92.80,14),
    bill('bdemophone','Phone plan','Bills',45,18),
    bill('bdemoinsurance','Car insurance','Bills',110,22),
    bill('bdemogym','Gym membership','Subscriptions',29,26),
    bill('bdemowater','Water bill','Bills',84,28,'Every 3 Months'),
    bill('bdemosalary','Studio salary','Income',2200,5,'Every 2 Weeks','income'),
    bill('bdemofreelance','Brand design project','Income',650,19,'One-Time','income'),
    bill('bdemoshop','Etsy shop payout','Income',320,27,'Monthly','income')
  ];
  const paymentOverrides={};
  // Example paid bills: only dates that have already arrived.
  for(const id of ['bdemorent','bdemointernet','bdemostream']){
    const b=bills.find(b=>b.id===id);
    if(b.firstDate<=E.today())paymentOverrides[b.id+':'+b.firstDate]={paid:true};
  }
  return {schemaVersion:1,settings:{currencySymbol:'$',weekStartsOn:'Monday'},bills,paymentOverrides};
};
