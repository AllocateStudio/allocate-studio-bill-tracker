/* ADD / EDIT BILL DIALOG */
'use strict';
const BillForms=(function(){
  let selectedPayment=null;

  function openBillForm(bill,payment=null){
    selectedPayment=payment;
    if(bill&&!selectedPayment){
      let date=E.nextDueDate(bill);
      if(!date)date=E.generatePayments([bill],bill.activeFrom||bill.firstDate,bill.lastDate||E.today()).at(-1)?.date;
      if(!date){toast('No scheduled payment to edit.');return;}
      const id=bill.id+':'+date,o=state.paymentOverrides[id]||{};
      selectedPayment={id,date:o.date||date,amount:o.amount??bill.amount};
    }
    $('#edit-scope-field').hidden=!bill;
    $('#edit-scope').value=payment||bill?.archived?'one':'following';
    $('#edit-scope').disabled=!!bill?.archived;
    $('#bill-form-error').textContent='';
    $('#bill-category').innerHTML=categoryOptions();
    $('#bill-category').value=bill?bill.category:categoriesFor().find(c=>c.type===(view.screen==='income'?'income':'bill')).name;
    $('#bill-id').value=bill?bill.id:'';
    $('#bill-name').value=bill?bill.name:'';
    $('#bill-amount').value=selectedPayment?selectedPayment.amount:'';
    $('#bill-frequency').value=bill?bill.frequency:'Monthly';
    $('#bill-first-date').value=selectedPayment?selectedPayment.date:E.today();
    $('#bill-last-date').value=bill?.lastDate||'';
    $('#bill-delete').hidden=!bill;
    $('#bill-archive').hidden=!bill||!!bill.archived||!!bill.history;
    updateScope();
    $('#bill-dialog').showModal();
  }

  function handleBillSubmit(ev){
    ev.preventDefault();
    const name=$('#bill-name').value.trim(),category=$('#bill-category').value.trim();
    const amount=Number($('#bill-amount').value),firstDate=$('#bill-first-date').value,frequency=$('#bill-frequency').value;
    if(!name||!category){$('#bill-form-error').textContent='Name and category are required.';return;}
    if(!Number.isFinite(amount)||amount<0||amount>1e12){$('#bill-form-error').textContent='Enter a valid amount.';return;}
    if(!firstDate){$('#bill-form-error').textContent='Pick a first due date.';return;}
    const lastDate=$('#bill-last-date').value;
    if(!validDate(firstDate)||($('#edit-scope').value!=='one'&&lastDate&&(!validDate(lastDate)||lastDate<firstDate))){$('#bill-form-error').textContent='Choose valid dates; the last date must be on or after the first.';return;}
    const type=categoryType(category);
    if(!categoriesFor().some(c=>c.name===category)){$('#bill-form-error').textContent='Choose a category from the list.';return;}
    const id=$('#bill-id').value;
    const original=state;
    try{
      let updated;
      if(id){
        if(!selectedPayment)throw Error('Select a payment first.');
        const source=state.bills.find(b=>b.id===id);
        const renamed=name!==source.name;
        const base=renamed?renamedState(state,id,name):JSON.parse(JSON.stringify(state));
        const paymentChanged=firstDate!==selectedPayment.date||amount!==selectedPayment.amount;
        if($('#edit-scope').value==='one'){
          if(paymentChanged&&source.archived&&!state.paymentOverrides[selectedPayment.id]?.paid&&firstDate>source.archiveDate)throw Error('Restore this schedule before moving an unpaid payment beyond its archive date.');
          updated=base;
          if(paymentChanged)updated.paymentOverrides[selectedPayment.id]={...updated.paymentOverrides[selectedPayment.id],date:firstDate,amount};
        }else{
          const scheduleChanged=paymentChanged||category!==source.category||frequency!==source.frequency||lastDate!==(source.lastDate||'')||type!==(source.type||'bill');
          updated=scheduleChanged?E.editFollowing(base,id,selectedPayment.id.slice(-10),{name,category,amount,frequency,firstDate,lastDate,type},uid()):base;
        }
        validateState(updated);protectData('Before editing a scheduled payment');
      }else{
        updated=JSON.parse(JSON.stringify(state));
        updated.bills.push({id:uid(),name,category,amount,frequency,firstDate,lastDate,type});
        validateState(updated);
      }
      state=updated;
      if(!saveState()){state=original;$('#bill-form-error').textContent=storageIssue;return;}
    }catch(e){state=original;$('#bill-form-error').textContent=e.message;return;}
    closeDialog('#bill-dialog');
    render();toast((type==='income'?'Income':'Bill')+(id?' updated':' added'));
  }

  function updateCategoryLabels(){
    const income=categoryType($('#bill-category').value)==='income',kind=income?'income':'bill';
    $('#bill-dialog-title').textContent=($('#bill-id').value?'Edit ':'Add ')+(income?'income':'a bill');
    $('#entry-name-label').textContent=income?'Income name':'Bill name';
    $('#bill-name').placeholder=income?'Salary / Freelance':'Rent / Mortgage';
    $('#entry-first-label').textContent=selectedPayment?(income?'Payday':'Due date'):(income?'First payday':'First due date');
    $('#entry-last-label').textContent=income?'Last payday':'Last due date';
    $('#entry-save').textContent='Save '+kind;
    $('#bill-delete').textContent='Delete '+kind;
    $('#bill-archive').textContent='Archive '+kind;

  }
  function updateScope(){
    const one=!!selectedPayment&&$('#edit-scope').value==='one';
    $('#bill-name').disabled=false;
    for(const id of ['#bill-category','#bill-frequency','#bill-last-date'])$(id).disabled=one;
    $('#edit-scope-note').textContent=selectedPayment?(one?'Amount and date changes apply only to this payment. Name changes apply to all linked payments.':`Changes begin with the payment scheduled for ${selectedPayment.id.slice(-10)}. Name changes apply to all linked payments. Earlier amounts, dates and Paid marks stay unchanged.`):'';
    updateCategoryLabels();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    $('#bill-category').addEventListener('change',updateCategoryLabels);
    $('#edit-scope').addEventListener('change',updateScope);
  });
  return {openBillForm,handleBillSubmit,updateCategoryLabels};
})();
