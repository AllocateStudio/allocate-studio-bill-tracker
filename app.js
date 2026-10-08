/* STATE · LOCAL STORAGE · RENDER ORCHESTRATION
   Persistence pattern (storage guard, recovery copies, export/import) ported from
   Allocate Studio Ultimate Budget's app.js, trimmed down for this single-entity app. */
'use strict';
const E=window.BillEngine, STORAGE_KEY=window.BILL_CALENDAR_DEMO?'allocate-studio-bill-calendar-demo-v1':'allocate-studio-bill-calendar-v1', RECOVERY_KEY=STORAGE_KEY+'-recovery-v1';
const CATEGORY_COLORS={
  Income:{bg:'#D6F25C',ink:'#203019'},
  Bills:{bg:'#FBDCE6',ink:'#B23A66'},
  Subscriptions:{bg:'#D8ECFB',ink:'#2A6CA8'},
  Debt:{bg:'#FCEFC0',ink:'#8A6D12'},
  Other:{bg:'#D8F3DE',ink:'#2F7D4C'},
  Lavender:{bg:'#DDC9FA',ink:'#513878'},
  Coral:{bg:'#F3B4AC',ink:'#793C38'},
  Peach:{bg:'#F8D2BA',ink:'#784626'},
  Apricot:{bg:'#F6CB94',ink:'#704719'},
  Rose:{bg:'#F2A8CE',ink:'#792D53'},
  Butter:{bg:'#FFE58C',ink:'#6E5714'},
  Teal:{bg:'#BCE4DD',ink:'#295E57'},
  Lilac:{bg:'#EBDAED',ink:'#69436E'}
};
let storageLoadFailed=false,lastStoredData=null,storageIssue='';
let state=loadState();
let view={screen:'calendar',mode:'month',statusFilter:'all',cursor:E.today()};

const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Amount fields are type=text/inputmode=decimal so the mobile keyboard only shows digits and a
// decimal separator; some locales/keyboards produce a comma there instead of a period.
const parseAmount=s=>Number(String(s??'').trim().replace(',','.'));

function starterState(){
  return {schemaVersion:1,settings:{currencySymbol:'$',weekStartsOn:'Monday'},bills:[],paymentOverrides:{}};
}
function categoriesFor(data=state){
  if(data.categories)return data.categories;
  const categories=['Income','Bills','Subscriptions','Debt','Other'].map(name=>({name,type:name==='Income'?'income':'bill',color:name}));
  for(const b of data.bills){
    if(b.type!=='income'&&!categories.some(c=>c.name===b.category))categories.push({name:b.category,type:'bill',color:'Other'});
  }
  return categories;
}
function categoryType(name){return categoriesFor().find(c=>c.name===name)?.type||'bill';}
function categoryOptions(){return categoriesFor().map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');}
function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s>='1900-01-01'&&s<='2199-12-31'&&!Number.isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
function validateState(s,context='save'){
  const fail=()=>{throw Error(context==='import'?'This is not a valid Bill Tracker backup. No data was replaced.':'Changes could not be saved. Check the entered values and try again.');};
  if(!s||s.schemaVersion!==1||!Array.isArray(s.bills)||s.bills.length>10000||!s.paymentOverrides||Array.isArray(s.paymentOverrides)||typeof s.paymentOverrides!=='object'||!s.settings)fail();
  if(typeof s.settings.currencySymbol!=='string'||!s.settings.currencySymbol.trim()||s.settings.currencySymbol.length>8||!['Monday','Sunday'].includes(s.settings.weekStartsOn))fail();
  if(s.categories!==undefined){
    if(!Array.isArray(s.categories)||!s.categories.length||s.categories.length>100)fail();
    const names=new Set();
    for(const c of s.categories){
      if(!c||typeof c.name!=='string'||!c.name.trim()||c.name!==c.name.trim()||c.name.length>40||!['bill','income'].includes(c.type)||!Object.hasOwn(CATEGORY_COLORS,c.color)||(c.type==='income')!==(c.color==='Income'))fail();
      const key=c.name.toLowerCase();if(names.has(key))fail();names.add(key);
    }
    if(s.categories.filter(c=>c.type==='income').length!==1||!s.categories.some(c=>c.type==='bill'))fail();
    for(const b of s.bills)if(!s.categories.some(c=>c.name===b.category&&c.type===(b.type||'bill')))fail();
  }
  const ids=new Set();
  for(const b of s.bills){
    if(!b||(b.type!==undefined&&!['bill','income'].includes(b.type))||typeof b.id!=='string'||!/^b[a-zA-Z0-9_-]+$/.test(b.id)||ids.has(b.id)||typeof b.name!=='string'||!b.name.trim()||b.name.length>60||typeof b.category!=='string'||!b.category.trim()||b.category.length>40||!Number.isFinite(b.amount)||b.amount<0||b.amount>1e12||!validDate(b.firstDate)||!(b.frequency in E.STEPS||b.frequency==='One-Time')||(b.lastDate&&(!validDate(b.lastDate)||b.lastDate<b.firstDate)))fail();
    if(b.activeFrom!==undefined&&(!validDate(b.activeFrom)||b.activeFrom<b.firstDate||(b.lastDate&&b.activeFrom>b.lastDate)))fail();
    if(b.seriesId!==undefined&&(typeof b.seriesId!=='string'||!/^b[a-zA-Z0-9_-]+$/.test(b.seriesId)))fail();
    if(b.history!==undefined&&typeof b.history!=='boolean')fail();
    if(b.archived!==undefined&&typeof b.archived!=='boolean')fail();
    if(b.archived&&!validDate(b.archiveDate))fail();
    ids.add(b.id);
  }
  for(const [id,o] of Object.entries(s.paymentOverrides)){
    const split=id.lastIndexOf(':');
    if(!ids.has(id.slice(0,split))||!validDate(id.slice(split+1))||!o||typeof o!=='object'||Array.isArray(o)||(o.paid!==undefined&&typeof o.paid!=='boolean')||(o.date!==undefined&&!validDate(o.date))||(o.amount!==undefined&&(!Number.isFinite(o.amount)||o.amount<0||o.amount>1e12)))fail();
  }
}
function loadState(){
  try{
    const saved=localStorage.getItem(STORAGE_KEY);lastStoredData=saved;
    if(saved){const s=JSON.parse(saved);validateState(s);return s;}
  }catch(e){storageLoadFailed=true;storageIssue='Saved data could not be loaded. Export or repair your saved file before replacing it.';}
  return window.BILL_CALENDAR_DEMO?window.createBillCalendarDemo():starterState();
}
function saveState(){
  if(storageLoadFailed){storageIssue='Saved data could not be loaded. Restore a valid backup or reset before saving. Your original saved data has been kept.';updateSaveStatus();return false;}
  try{
    if(localStorage.getItem(STORAGE_KEY)!==lastStoredData){storageIssue='Another tab changed this calendar. Saving is paused — export this tab as a backup before reloading.';updateSaveStatus();return false;}
    const serialized=JSON.stringify(state);localStorage.setItem(STORAGE_KEY,serialized);lastStoredData=serialized;storageIssue='';updateSaveStatus();return true;
  }catch(e){storageIssue='Your browser could not save changes. Export your data to keep a copy.';toast(storageIssue);updateSaveStatus();return false;}
}
function updateSaveStatus(){
  const el=$('#save-state');if(!el)return;
  const paused=storageLoadFailed||!!storageIssue;
  el.textContent=paused?'Saving paused':'Saved on this device';
  el.title=paused?storageIssue:'Your bills stay in this browser';
  el.dataset.status=paused?'paused':'ready';
}
function recoveryCopies(){
  const raw=localStorage.getItem(RECOVERY_KEY);if(!raw)return [];
  const copies=JSON.parse(raw);if(!Array.isArray(copies))throw Error('Recovery history could not be read.');
  return copies;
}
function protectData(reason){
  if(localStorage.getItem(STORAGE_KEY)!==lastStoredData)throw Error('Another tab changed this calendar. Export this tab as a backup and reload before replacing data.');
  const copies=recoveryCopies(),date=new Date().toISOString();
  if(storageLoadFailed&&lastStoredData)copies.push({date,reason:'Original unreadable saved data',data:lastStoredData});
  copies.push({date,reason,data:JSON.stringify(state)});
  try{localStorage.setItem(RECOVERY_KEY,JSON.stringify(copies.slice(-10)));}catch(e){throw Error('Could not create a safety copy. No data was replaced.');}
}
function commit(message){
  const saved=saveState();render();if(message||!saved)toast(saved?message:storageIssue);
}
function toast(message){
  const el=$('#toast');el.textContent=message;el.classList.add('visible');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),4000);
}
function download(content,name,type){
  const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');
  a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function exportData(){
  const d=new Date(),pad=n=>String(n).padStart(2,'0');
  const stamp=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  download(JSON.stringify(state,null,2),`AllocateStudio-bill-tracker-${stamp}.json`,'application/json');
}
function importData(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);validateState(parsed,'import');normalizeCategories(parsed);
      if(!confirm('Replace this calendar with the backup? A recovery copy of your current calendar will be kept in Settings.'))return;
      protectData('Replaced before import');
      state=parsed;storageLoadFailed=false;commit('Data imported');
    }catch(e){toast(e.message||'That file could not be imported.');}
  };
  reader.onerror=()=>toast('The backup file could not be read.');
  if(file.size>10000000){toast('Please choose a backup smaller than 10 MB.');return;}
  reader.readAsText(file);
}

/* UTILITIES */
function money(n){
  const amount=Math.abs(Number(n||0)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  return `${n<0?'−':''}${esc(state.settings.currencySymbol)}${amount}`;
}
function colorForCategory(name){
  const key=categoriesFor().find(c=>c.name===name)?.color||name;
  return Object.hasOwn(CATEGORY_COLORS,key)?CATEGORY_COLORS[key]:CATEGORY_COLORS.Other;
}

function uid(){return 'b'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);}

/* RENDER ORCHESTRATION */
function render(){
  updateSaveStatus();
  window.closeMonthPicker?.(false);
  BillCalendar.closeWeekPicker?.();
  document.querySelectorAll('.switch-pill').forEach(b=>b.classList.toggle('active',b.dataset.screen===view.screen));
  $('#btn-help').setAttribute('aria-pressed',String(view.screen==='help'));
  $('#fab-add').hidden=view.screen==='help';
  if(view.screen==='help')BillGuide.render($('#main'));
  else if(view.screen==='calendar')BillCalendar.renderCalendarScreen($('#main'));
  else BillCalendar.renderBillsScreen($('#main'));
}

function togglePaid(paymentId){
  const existing=state.paymentOverrides[paymentId]||{};
  state.paymentOverrides[paymentId]={...existing,paid:!existing.paid};
  commit();
}

function deleteBill(id){
  const income=state.bills.find(b=>b.id===id)?.type==='income';
  if(!confirm(income?'Delete this income and its scheduled paydays?':'Delete this bill? Its payment history will be removed too.'))return;
  try{protectData('Before deleting a bill');}catch(e){toast(e.message);return;}
  state.bills=state.bills.filter(b=>b.id!==id);
  for(const key of Object.keys(state.paymentOverrides))if(key.startsWith(id+':'))delete state.paymentOverrides[key];
  closeDialog('#bill-dialog');
  commit(income?'Income deleted':'Bill deleted');
}

function closeDialog(sel){const d=$(sel);if(d?.open)d.close();}

function wireChrome(){
  document.querySelectorAll('.switch-pill').forEach(btn=>btn.addEventListener('click',()=>{view.screen=btn.dataset.screen;render();}));
  $('#payment-form').addEventListener('submit',e=>{e.preventDefault();const date=$('#payment-date').value,amount=parseAmount($('#payment-amount').value),id=$('#payment-id').value;if(!validDate(date)||!Number.isFinite(amount)||amount<0||amount>1e12)return;state.paymentOverrides[id]={...state.paymentOverrides[id],date,amount};closeDialog('#payment-dialog');commit('Payment updated');});
  $('#btn-help').addEventListener('click',()=>{view.screen='help';render();$('#main').focus();});
  $('#btn-settings').addEventListener('click',openSettings);
  $('#settings-form').addEventListener('submit',saveSettings);
  $('#currency').addEventListener('change',updateCurrencyField);
  $('#add-category').addEventListener('click',addCategoryRow);
  $('#fab-add').addEventListener('click',()=>BillForms.openBillForm(null));
  $('#btn-export').addEventListener('click',exportData);
  $('#btn-import').addEventListener('click',()=>$('#import-file').click());
  $('#import-file').addEventListener('change',e=>{const f=e.target.files[0];if(f)importData(f);e.target.value='';});
  $('#bill-dialog-close').addEventListener('click',()=>closeDialog('#bill-dialog'));
  $('#bill-cancel').addEventListener('click',()=>closeDialog('#bill-dialog'));
  $('#day-dialog-close').addEventListener('click',()=>closeDialog('#day-dialog'));
  $('#day-dialog-done').addEventListener('click',()=>closeDialog('#day-dialog'));
  $('#bill-form').addEventListener('submit',BillForms.handleBillSubmit);
  $('#bill-archive').addEventListener('click',()=>archiveBill($('#bill-id').value));
  $('#bill-delete').addEventListener('click',()=>deleteBill($('#bill-id').value));
}

document.addEventListener('DOMContentLoaded',()=>{wireChrome();migrateCategories();render();if(window.BILL_CALENDAR_DEMO&&!lastStoredData&&!storageLoadFailed)saveState();});

let settingsCategories=[];
function renderCategorySettings(){
  const colourNames={Income:'Acid green',Bills:'Pink',Subscriptions:'Blue',Debt:'Pale yellow',Other:'Pale green',Lavender:'Lavender',Coral:'Coral',Peach:'Peach',Apricot:'Apricot',Rose:'Rose',Butter:'Butter yellow',Teal:'Soft teal',Lilac:'Lilac'};
  $('#category-settings-list').innerHTML=settingsCategories.map((c,i)=>`<div class="category-settings-row"><label>Name<input data-category-name="${i}" value="${esc(c.name)}" maxlength="40" required aria-label="Category ${i+1} name"></label><div class="category-colour-field"><span>${c.type==='income'?'Income colour':'Colour'}</span><input type="hidden" data-category-color="${i}" value="${esc(c.color)}"><div class="category-swatches ${c.type==='income'?'income-swatches':''}" role="group" aria-label="Category ${i+1} colour">${(c.type==='income'?['Income']:['Bills','Subscriptions','Lavender','Coral','Peach','Apricot','Debt','Other','Rose','Butter','Teal','Lilac']).map(key=>`<button type="button" class="category-swatch" data-colour-row="${i}" data-colour="${key}" aria-label="${colourNames[key]}" title="${colourNames[key]}${c.type==='income'?' (income)':''}" aria-pressed="${key===c.color}" style="--swatch:${CATEGORY_COLORS[key].bg}"><span aria-hidden="true">${key===c.color?'✓':''}</span></button>`).join('')}</div></div></div>`).join('');
  $('#category-settings-list').querySelectorAll('[data-colour]').forEach(button=>button.addEventListener('click',()=>{
    const row=button.dataset.colourRow;
    $(`[data-category-color="${row}"]`).value=button.dataset.colour;
    $('#category-settings-list').querySelectorAll(`[data-colour-row="${row}"]`).forEach(option=>{
      const selected=option===button;option.setAttribute('aria-pressed',String(selected));option.querySelector('span').textContent=selected?'✓':'';
    });
  }));
}
function readCategorySettings(){
  return settingsCategories.map((c,i)=>({...c,name:$(`[data-category-name="${i}"]`).value.trim(),color:$(`[data-category-color="${i}"]`).value}));
}
function addCategoryRow(){
  settingsCategories=readCategorySettings();
  if(settingsCategories.length>=100){$('#settings-error').textContent='You can have up to 100 categories.';return;}
  settingsCategories.push({name:'',type:'bill',color:'Other',originalName:null});
  renderCategorySettings();$(`[data-category-name="${settingsCategories.length-1}"]`).focus();
}
function buildSettingsUpdate(data,draft,currencySymbol,weekStartsOn){
  const updated=JSON.parse(JSON.stringify(data));
  const names=draft.map(c=>c.name.trim().toLowerCase());
  if(names.some(n=>!n)||new Set(names).size!==names.length)throw Error('Give each category a unique name.');
  if(draft.some(c=>c.name.trim().length>40))throw Error('Category names can have up to 40 characters.');
  const renamed=new Map(draft.filter(c=>c.originalName!==null).map(c=>[c.originalName,c.name.trim()]));
  updated.categories=draft.map(({name,type,color})=>({name:name.trim(),type,color}));
  for(const b of updated.bills)b.category=renamed.get(b.category)||b.category;
  updated.settings={...updated.settings,currencySymbol,weekStartsOn};
  validateState(updated);return updated;
}
function saveSettings(event){
  event.preventDefault();const original=state;
  try{
    const updated=buildSettingsUpdate(state,readCategorySettings(),($('#currency').value==='custom'?$('#currency-custom').value:$('#currency').value).trim(),$('#week-start').value);
    protectData('Before changing settings and categories');state=updated;
    if(!saveState()){state=original;$('#settings-error').textContent=storageIssue;return;}
    closeDialog('#settings-dialog');render();toast('Settings saved');
  }catch(e){state=original;$('#settings-error').textContent=e.message;}
}
function updateCurrencyField(){
  const custom=$('#currency').value==='custom';
  $('#custom-currency-field').hidden=!custom;
  $('#currency-custom').disabled=!custom;
  $('#currency-custom').required=custom;
}
function openSettings(){
  settingsCategories=categoriesFor().map(c=>({...c,originalName:c.name}));
  renderCategorySettings();$('#settings-error').textContent='';
  const symbol=state.settings.currencySymbol;
  const known=['$', '€', '£', 'CA$', 'A$', 'NZ$', 'CHF', '¥', 'CN¥', '₹', '₽', '₴', 'zł', 'R$', 'MX$', 'S$', 'HK$', 'AED', '₩', '₺'];
  $('#currency').value=known.includes(symbol)?symbol:'custom';
  $('#currency-custom').value=known.includes(symbol)?'':symbol;updateCurrencyField();
  $('#week-start').value=state.settings.weekStartsOn;
  const el=$('#recovery-list');
  try{const copies=recoveryCopies();el.innerHTML=copies.length?`<details class="recovery-details"><summary>Recovery copies (${copies.length})</summary><div class="recovery-items">${copies.map((c,i)=>({c,i})).reverse().map(({c,i})=>`<button type="button" class="textbtn recovery-btn" data-recovery="${i}">Download ${esc(c.reason)} · ${esc(new Date(c.date).toLocaleString())}</button>`).join('')}</div></details>`:'';el.querySelectorAll('[data-recovery]').forEach(b=>b.onclick=()=>download(copies[Number(b.dataset.recovery)].data,'BillTracker-recovery.json','application/json'));}catch(e){el.textContent=e.message;}
  $('#settings-dialog').showModal();
}
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY&&event.newValue!==lastStoredData){storageIssue='Another tab changed this calendar. Export any unsaved changes here, then reload before editing.';render();}});

// Ultimate Budget's month-picker.js component dispatches a plain 'change' on its hidden input.
document.addEventListener('change',event=>{
  if(event.target.id!=='cal-month-input')return;
  if(!/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(event.target.value))return;
  view.cursor=event.target.value+'-01';
  render();
});

// Keep custom categories intact on reload and backup import.
function normalizeCategories(data){
  if(data.categories)return false;
  let changed=false;
  for(const b of data.bills)if(b.type==='income'&&b.category!=='Income'){b.category='Income';changed=true;}
  return changed;
}
function migrateCategories(){
  if(storageLoadFailed)return;
  const updated=JSON.parse(JSON.stringify(state));
  if(!normalizeCategories(updated))return;
  try{protectData('Before simplifying categories');state=updated;saveState();}
  catch(e){toast(e.message||'Categories could not be updated.');}
}

function archiveBill(id,restore=false){
  const bill=state.bills.find(b=>b.id===id);if(!bill||!!bill.archived===!restore)return;
  const cutoff=E.today();
  const question=restore?`Restore ${bill.name}? Unpaid occurrences since it was archived will reappear and may be overdue.`:`Archive ${bill.name}? Unpaid payments after ${cutoff} will stop. Payments through today and all Paid records will stay. You can restore it from Archived.`;
  if(!confirm(question))return;
  const original=state;
  try{
    const updated=JSON.parse(JSON.stringify(state)),entry=updated.bills.find(b=>b.id===id);
    if(restore){delete entry.archived;delete entry.archiveDate;}
    else{entry.archived=true;entry.archiveDate=cutoff;}
    validateState(updated);protectData(restore?'Before restoring a schedule':'Before archiving a schedule');
    state=updated;if(!saveState()){state=original;render();toast(storageIssue);return;}
    closeDialog('#bill-dialog');render();toast(restore?'Schedule restored':'Schedule archived');
  }catch(e){state=original;toast(e.message);}
}

// Rename a schedule family without editing any occurrence or splitting its dates.
function renamedState(data,id,name){
  name=name.trim();if(!name||name.length>60)throw Error('Enter a name of up to 60 characters.');
  const result=JSON.parse(JSON.stringify(data)),source=result.bills.find(b=>b.id===id);
  if(!source)throw Error('This schedule no longer exists.');
  const linked=new Set([source]);
  // Older backups have no family ID. Reconnect only unambiguous adjacent
  // history segments with matching names (including capitalization changes).
  let changed=true;
  while(changed){
    changed=false;
    for(const b of [...linked]){
      for(const c of result.bills)if(b.seriesId&&c.seriesId===b.seriesId&&!linked.has(c)){linked.add(c);changed=true;}
      const matches=(a,z)=>a.history&&a.lastDate&&z.activeFrom&&E.addDays(a.lastDate,1)===z.activeFrom&&a.name.trim().toLowerCase()===z.name.trim().toLowerCase()&&(a.type||'bill')===(z.type||'bill')&&(!a.seriesId||!z.seriesId||a.seriesId===z.seriesId);
      for(const direction of ['before','after']){
        const candidates=result.bills.filter(c=>c!==b&&(direction==='before'?matches(c,b):matches(b,c)));
        if(candidates.length!==1)continue;
        const c=candidates[0],reverse=result.bills.filter(x=>x!==c&&(direction==='before'?matches(c,x):matches(x,c)));
        if(reverse.length===1&&!linked.has(c)){linked.add(c);changed=true;}
      }
    }
  }
  const family=source.seriesId||source.id;
  for(const b of linked){b.name=name;b.seriesId=family;}
  validateState(result);return result;
}
