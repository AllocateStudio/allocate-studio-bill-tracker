/* CALENDAR + BILLS SCREEN RENDERING */
'use strict';
const BillCalendar=(function(){

  function weekdayLabels(weekStartsOn){
    const names=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return weekStartsOn==='Sunday'?['Sun',...names.slice(0,6)]:names;
  }

  function statsStrip(month){
    const weekly=view.mode==='week';
    const from=weekly?E.startOfWeek(view.cursor,state.settings.weekStartsOn):E.startOfMonth(month),to=weekly?E.addDays(from,6):E.endOfMonth(month);
    const payments=E.calculatePayments(state.bills,state.paymentOverrides,from,to);
    const s=E.periodStats(payments,from,to);
    const format=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
    const label=weekly?format.formatRange(new Date(from+'T12:00:00Z'),new Date(to+'T12:00:00Z')):new Date(month+'-01T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
    return `
      <div class="stats-head">
        <h1 class="${weekly?'week-range':''}">${esc(label)}</h1>
      </div>
      <div class="stats-strip">
        <div class="stat-tile tone-ink"><span class="stat-label">Due this ${weekly?'week':'month'}</span><span class="stat-value">${money(s.total)}</span></div>
        <div class="stat-tile tone-mint"><span class="stat-label">Paid</span><span class="stat-value">${money(s.paid)}</span></div>
        <div class="stat-tile tone-sky"><span class="stat-label">Remaining</span><span class="stat-value">${money(s.remaining)}</span></div>
        <div class="stat-tile tone-blush"><span class="stat-label">Overdue</span><span class="stat-value">${money(s.overdue)}</span></div>
      </div>
      <div class="progress-label"><span>Payment progress</span><strong>${Math.round(s.progress*100)}% paid</strong></div><div class="progress" role="progressbar" aria-label="Payment progress" aria-valuenow="${Math.round(s.progress*100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(100,Math.round(s.progress*100))}%"></span></div>
    `;
  }

  // Month/year selection reuses Ultimate Budget's month-picker.js component (same
  // trigger + popover + year-zoom grid), just without its optional "+ Add month" button.
  const CAL_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5zM5 10h14M8 3v5M16 3v5"/></svg>';
  function monthModeNav(cursorMonth){
    const dayLabel=new Date(view.cursor+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',timeZone:'UTC'});
    return `
      <div class="cal-toolbar">
        <div class="mode-switch" id="mode-switch">
          <button type="button" class="mode-pill ${view.mode==='month'?'active':''}" data-mode="month">Month</button>
          <button type="button" class="mode-pill ${view.mode==='week'?'active':''}" data-mode="week">Week</button>
        </div>
        <div class="nav-arrows">
          ${view.mode==='month'
            ?`${window.renderMonthPicker({value:cursorMonth,id:'cal-month-input',locale:'en-US'})}`
            :`<div class="week-nav-picker" role="group" aria-label="Week navigation"><button type="button" class="mp-step" id="nav-prev" aria-label="Previous week">&#8249;</button><button type="button" class="mp-trigger week-date-jump" id="week-date-trigger" aria-haspopup="dialog" aria-label="Jump to a date: ${esc(dayLabel)}">${CAL_ICON}<span>${esc(dayLabel)}</span></button><button type="button" class="mp-step" id="nav-next" aria-label="Next week">&#8250;</button></div>`
          }
        </div>
      </div>
    `;
  }

  // Week mode's own mini calendar — same dialog chrome as the month picker (.mp-dialog/.mp-header/.mp-footer),
  // but a real day grid, since "jump to a date" belongs to the week view, not a month/year jump.
  let weekPickerDialog=null;
  function closeWeekPicker(){
    if(!weekPickerDialog)return;
    const d=weekPickerDialog;weekPickerDialog=null;d.close();d.remove();
  }
  function weekPickerBody(cursorDate){
    const month=cursorDate.slice(0,7);
    const gridStart=E.startOfWeek(E.startOfMonth(month),state.settings.weekStartsOn);
    const todayStr=E.today();
    const weekStart=E.startOfWeek(view.cursor,state.settings.weekStartsOn),weekEnd=E.addDays(weekStart,6);
    const monthLabel=new Date(month+'-01T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
    let cells='';
    for(let i=0;i<42;i++){
      const d=E.addDays(gridStart,i);
      const inMonth=d.slice(0,7)===month;
      cells+=`<button type="button" class="wk-day ${inMonth?'':'outside'} ${d===todayStr?'wk-today':''} ${d>=weekStart&&d<=weekEnd?'wk-selected':''}" data-wk-date="${d}" aria-label="${d}">${Number(d.slice(8,10))}</button>`;
    }
    return `<div class="mp-header"><button type="button" class="mp-arrow" data-wk-nav="-1" aria-label="Previous month">&#8249;</button><span class="mp-year">${esc(monthLabel)}</span><button type="button" class="mp-arrow" data-wk-nav="1" aria-label="Next month">&#8250;</button></div>
      <div class="wk-grid">${weekdayLabels(state.settings.weekStartsOn).map(l=>`<div class="wk-weekday">${l}</div>`).join('')}${cells}</div>
      <div class="mp-footer"><button type="button" data-wk-thisweek>Today</button><button type="button" class="mp-close" data-wk-close aria-label="Close date picker">&times;</button></div>`;
  }
  function openWeekPicker(trigger){
    closeWeekPicker();
    let cursorDate=view.cursor;
    const dialog=document.createElement('dialog');
    dialog.className='mp-dialog wk-date-dialog';
    dialog.setAttribute('aria-label','Jump to a date');
    weekPickerDialog=dialog;
    document.body.append(dialog);
    function position(){
      if(matchMedia('(max-width:600px)').matches){dialog.style.left='8px';dialog.style.top='auto';return;}
      const r=trigger.getBoundingClientRect(),h=dialog.getBoundingClientRect().height,w=dialog.getBoundingClientRect().width;
      dialog.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';
      dialog.style.top=Math.max(8,Math.min(r.bottom+8+h<=innerHeight-8?r.bottom+8:r.top-h-8,innerHeight-h-8))+'px';
    }
    function draw(){
      dialog.innerHTML=weekPickerBody(cursorDate);
      dialog.querySelectorAll('[data-wk-date]').forEach(btn=>btn.addEventListener('click',()=>{view.cursor=btn.dataset.wkDate;closeWeekPicker();render();}));
      dialog.querySelector('[data-wk-nav="-1"]').addEventListener('click',()=>{cursorDate=E.addMonthKey(cursorDate.slice(0,7),-1)+'-01';draw();position();});
      dialog.querySelector('[data-wk-nav="1"]').addEventListener('click',()=>{cursorDate=E.addMonthKey(cursorDate.slice(0,7),1)+'-01';draw();position();});
      dialog.querySelector('[data-wk-thisweek]').addEventListener('click',()=>{view.cursor=E.today();closeWeekPicker();render();});
      dialog.querySelector('[data-wk-close]').addEventListener('click',closeWeekPicker);
    }
    draw();
    dialog.addEventListener('pointerdown',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeWeekPicker();});
    dialog.addEventListener('cancel',e=>{e.preventDefault();closeWeekPicker();});
    dialog.showModal();position();
  }

  function paidCheck(p){
    return `<label class="paid-check" title="${p.paid?'Mark unpaid':'Mark paid'}: ${esc(p.name)}"><input type="checkbox" data-toggle-paid="${p.id}" ${p.paid?'checked':''} aria-label="Paid: ${esc(p.name)} on ${p.date}"><span class="sr-only">Paid</span></label>`;
  }

  function wirePaidControls(container,afterChange){
    container.querySelectorAll('.paid-check').forEach(label=>label.addEventListener('click',e=>e.stopPropagation()));
    container.querySelectorAll('[data-toggle-paid]').forEach(cb=>cb.addEventListener('change',()=>{
      const id=cb.dataset.togglePaid;
      state.paymentOverrides[id]={...state.paymentOverrides[id],paid:cb.checked};
      commit();if(afterChange)afterChange();
    }));
    container.querySelectorAll('[data-paid-date]').forEach(cb=>{
      cb.indeterminate=cb.dataset.mixed==='true';
      cb.addEventListener('change',()=>{
        const d=cb.dataset.paidDate;
        for(const p of E.calculatePayments(state.bills,state.paymentOverrides,d,d).filter(p=>p.type==='income'))state.paymentOverrides[p.id]={...state.paymentOverrides[p.id],paid:cb.checked};
        commit();if(afterChange)afterChange();
      });
    });
  }

  function dayPill(p){
    const c=colorForCategory(p.category);
    return `<div class="payment-pill ${p.paid?'payment-paid':''} ${p.status==='Overdue'?'payment-overdue':''}" style="--category-bg:${c.bg}"><button type="button" class="day-pill ${p.paid?'is-paid':''} ${p.status==='Overdue'?'late':''}" data-date="${p.date}" title="${esc(p.name)} · ${money(p.amount)} · ${p.status}"><span class="payment-name">${esc(p.name)}</span><span class="payment-amount">${money(p.amount)}</span></button></div>`;
  }

  function paydayPill(incomes,date){
    if(!incomes.length)return '';
    const status=incomes.every(p=>p.paid)?'Paid':incomes.some(p=>p.status==='Overdue')?'Overdue':'Upcoming';
    return `<button type="button" class="payday-pill" title="Payday — view income" data-payday="${date}" aria-label="Payday, ${incomes.length} income ${incomes.length===1?'source':'sources'}, ${status}">Payday${incomes.length>1?` · ${incomes.length}`:''}</button>`;
  }

  function renderMonthGrid(month){
    const monthStart=E.startOfMonth(month);
    const gridStart=E.startOfWeek(monthStart,state.settings.weekStartsOn);
    const gridEnd=E.addDays(gridStart,41);
    const payments=E.filterPayments(E.calculatePayments(state.bills,state.paymentOverrides,gridStart,gridEnd),view.statusFilter);
    const byDate={};for(const p of payments){(byDate[p.date]=byDate[p.date]||[]).push(p);}
    const todayStr=E.today();
    let cells='';
    for(let i=0;i<42;i++){
      const d=E.addDays(gridStart,i);
      const inMonth=d.slice(0,7)===month;
      const items=byDate[d]||[],dayPayments=items.filter(p=>p.type!=='income'),incomes=items.filter(p=>p.type==='income');
      const dayNum=Number(d.slice(8,10));
      cells+=`<div role="button" tabindex="0" aria-label="${d}, ${dayPayments.length} bills, ${incomes.length} income sources" class="cal-day ${inMonth?'':'outside'} ${d===todayStr?'is-today':''}" data-date="${d}">
        <div class="day-heading ${incomes.length?'has-payday':''} ${incomes.length&&incomes.every(p=>p.paid)?'payday-paid':''} ${incomes.some(p=>p.status==='Overdue')?'payday-overdue':''}"><span class="day-num">${dayNum}</span>${paydayPill(incomes,d)}</div>
        <div class="day-pills">${dayPayments.slice(0,3).map(dayPill).join('')}${dayPayments.length>3?`<span class="day-more">+${dayPayments.length-3} more</span>`:''}</div>
      </div>`;
    }
    const labels=weekdayLabels(state.settings.weekStartsOn);
    return `<div class="cal-grid">
      ${labels.map(l=>`<div class="cal-weekday">${l}</div>`).join('')}
      ${cells}
    </div>`;
  }

  function renderWeekList(weekStart){
    const weekEnd=E.addDays(weekStart,6);
    const payments=E.filterPayments(E.calculatePayments(state.bills,state.paymentOverrides,weekStart,weekEnd),view.statusFilter);
    const byDate={};for(const p of payments){(byDate[p.date]=byDate[p.date]||[]).push(p);}
    const todayStr=E.today();
    let rows='';
    for(let i=0;i<7;i++){
      const d=E.addDays(weekStart,i);
      const items=byDate[d]||[],dayPayments=items.filter(p=>p.type!=='income'),incomes=items.filter(p=>p.type==='income');
      const label=new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric',timeZone:'UTC'});
      rows+=`<div role="button" tabindex="0" class="week-row ${d===todayStr?'is-today':''}" data-date="${d}">
        <div class="week-day-heading ${incomes.length?'has-payday':''} ${incomes.length&&incomes.every(p=>p.paid)?'payday-paid':''} ${incomes.some(p=>p.status==='Overdue')?'payday-overdue':''}"><div class="week-row-label">${esc(label)}</div>${paydayPill(incomes,d)}</div>
        <div class="week-row-pills">${dayPayments.length?dayPayments.map(dayPill).join(''):`<span class="week-row-empty">${view.statusFilter&&view.statusFilter!=='all'?'No matching bills':'No bills due'}</span>`}</div>
      </div>`;
    }
    return `<div class="week-list">${rows}</div>`;
  }

  function nextSevenCard(){
    const s=E.nextSevenDays(state.bills,state.paymentOverrides);
    const format=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
    return `<section class="next-seven" aria-label="Bills due in the next seven days"><div><h2>Due in the next 7 days</h2><p>${format(s.from)} – ${format(s.to)} · ${s.count} unpaid bill${s.count===1?'':'s'} · Includes today</p></div><strong>${money(s.total)}</strong></section>`;
  }

  function statusFilters(){
    const active=view.statusFilter||'all';
    return `<div class="payment-filters" role="group" aria-label="Filter calendar by payment status">${[['all','All'],['unpaid','Unpaid'],['overdue','Overdue']].map(([key,label])=>`<button type="button" class="filter-pill ${active===key?'active':''}" data-status-filter="${key}" aria-pressed="${active===key}">${label}</button>`).join('')}</div>`;
  }

  function renderCalendarScreen(main){
    const month=view.cursor.slice(0,7);
    main.innerHTML=`
      ${storageIssue?`<p class="save-warning" role="alert">${esc(storageIssue)}</p>`:""}${statsStrip(month)}
      ${!state.bills.length?`<section class="empty-banner"><div><h2>A little planning. A lighter mind.</h2><p>Add your first bill and give every payment a place.</p></div><button class="btn primary" id="first-bill">Add your first bill</button></section>`:""}
      ${nextSevenCard()}
      ${monthModeNav(month)}
      ${statusFilters()}
      ${view.mode==='week'?`<p class="week-range">${E.startOfWeek(view.cursor,state.settings.weekStartsOn)} — ${E.addDays(E.startOfWeek(view.cursor,state.settings.weekStartsOn),6)}</p>`:""}<div id="cal-body">${view.mode==='month'?renderMonthGrid(month):renderWeekList(E.startOfWeek(view.cursor,state.settings.weekStartsOn))}</div>
      <div class="payment-status-legend" aria-label="Payment status legend"><span class="legend-paid">Paid</span><span class="legend-overdue">Overdue</span><span>Upcoming</span></div>
    `;
    main.querySelector('#first-bill')?.addEventListener('click',()=>BillForms.openBillForm(null));
    main.querySelectorAll('[data-status-filter]').forEach(btn=>btn.addEventListener('click',()=>{view.statusFilter=btn.dataset.statusFilter;render();main.querySelector(`[data-status-filter="${view.statusFilter}"]`)?.focus();}));
    main.querySelectorAll('.mode-pill').forEach(btn=>btn.addEventListener('click',()=>{view.mode=btn.dataset.mode;render();}));
    if(view.mode==='week'){
      main.querySelector('#nav-prev').addEventListener('click',()=>{navigate(-1);});
      main.querySelector('#nav-next').addEventListener('click',()=>{navigate(1);});
      main.querySelector('#week-date-trigger').addEventListener('click',e=>openWeekPicker(e.currentTarget));
    }
    main.querySelectorAll('[data-payday]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openIncomeDetail(btn.dataset.payday);}));
    main.querySelectorAll('.cal-day,.week-row').forEach(el=>{el.addEventListener('click',()=>openDayDetail(el.dataset.date));el.addEventListener('keydown',e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDayDetail(el.dataset.date);}});});
  }

  // Week mode steps by 7 days; month mode steps through the month-picker's own ‹ › buttons.
  function navigate(dir){
    view.cursor=E.addDays(view.cursor,dir*7);
    render();
  }

  function openDayDetail(dateStr){
    const all=E.calculatePayments(state.bills,state.paymentOverrides,dateStr,dateStr),payments=all.filter(p=>p.type!=='income'),incomes=all.filter(p=>p.type==='income');
    const label=new Date(dateStr+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'});
    $('#day-dialog-title').textContent=label;
    const body=$('#day-dialog-body');
    body.innerHTML=payments.length?payments.map(p=>{
      const c=colorForCategory(p.category);
      return `<div class="day-detail-row ${p.paid?'payment-paid':''} ${p.status==='Overdue'?'payment-overdue':''}">
        ${paidCheck(p)}
        <span class="chip" style="background:${c.bg};color:${c.ink}">${esc(p.category)}</span>
        <span class="day-detail-name ${p.paid?'is-paid':''}">${esc(p.name)}</span>
        <span class="day-detail-amount">${money(p.amount)}</span>
        <span class="status-tag status-${p.status}">${p.status}</span>
      </div><button type="button" class="textbtn" data-adjust="${p.id}">Adjust ${esc(p.name)}</button>`;
    }).join(''):'<p class="empty-note">No bills due this day.</p>';
    if(incomes.length){body.innerHTML=incomes.map(p=>`<div class="day-detail-row ${p.paid?'payment-paid':''} ${p.status==='Overdue'?'payment-overdue':''}">${paidCheck(p)}<span class="day-detail-name">${esc(p.name)}</span><strong>+${money(p.amount)}</strong><span class="status-tag">${p.paid?'Paid':'Income'}</span></div>`).join('')+`<button class="payday-detail-link" type="button" id="day-income">Payday · ${incomes.length} income ${incomes.length===1?'source':'sources'} · ${money(incomes.reduce((sum,p)=>sum+p.amount,0))}</button>`+body.innerHTML;body.querySelector('#day-income').onclick=()=>{closeDialog('#day-dialog');openIncomeDetail(dateStr);};}
    body.querySelectorAll('[data-adjust]').forEach(btn=>btn.onclick=()=>{
      const payment=payments.find(p=>p.id===btn.dataset.adjust),bill=state.bills.find(b=>b.id===payment.billId);
      closeDialog('#day-dialog');BillForms.openBillForm(bill,payment);
    });
    wirePaidControls(body,()=>openDayDetail(dateStr));
    if(!$('#day-dialog').open)$('#day-dialog').showModal();
  }

  function renderBillsScreen(main){
    const todayStr=E.today();
    const isIncome=view.screen==='income',entries=state.bills.filter(b=>!b.history&&(b.type==='income')===isIncome&&!!b.archived===!!view.showArchived);
    const rows=entries.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(bill=>{
      const c=colorForCategory(bill.category);
      const next=E.nextDueDate(bill,todayStr);
      return `<div class="bill-card" data-id="${bill.id}">
        <span class="chip" style="background:${c.bg};color:${c.ink}">${esc(bill.category)}</span>
        <div class="bill-card-main">
          <span class="bill-card-name">${esc(bill.name)}</span>
          <span class="bill-card-meta">${esc(bill.frequency)} · ${bill.archived?'archived '+bill.archiveDate:next?'next '+esc(next):'schedule ended'}</span>
        </div>
        <span class="bill-card-amount">${money(bill.amount)}</span>
        ${bill.archived?`<button type="button" class="btn" data-restore="${bill.id}">Restore</button>`:`<button type="button" class="icon-btn" data-edit="${bill.id}" aria-label="Edit ${esc(bill.name)}">&#9998;</button><button type="button" class="textbtn" data-archive="${bill.id}">Archive</button>`}

      </div>`;
    }).join('');
    main.innerHTML=`
      <div class="stats-head"><h1>${isIncome?'Your income':'Your bills'}</h1><p class="muted">${entries.length} ${isIncome?'income source':'bill'}${entries.length===1?'':'s'}</p></div>
      <div class="archive-switch" role="group" aria-label="Schedule list"><button type="button" class="filter-pill ${!view.showArchived?'active':''}" data-archive-view="active" aria-pressed="${!view.showArchived}">Active</button><button type="button" class="filter-pill ${view.showArchived?'active':''}" data-archive-view="archived" aria-pressed="${!!view.showArchived}">Archived</button></div>
      <div class="bills-list">${rows||`<div class="empty"><h3>${view.showArchived?'No archived schedules':isIncome?'No income yet':'No bills yet'}</h3><p>${view.showArchived?'Archived schedules keep their history in the calendar.':`Tap + to add ${isIncome?'an income source and its paydays':'your first bill'}.`}</p></div>`}</div>
    `;
    main.querySelectorAll('[data-archive-view]').forEach(btn=>btn.onclick=()=>{view.showArchived=btn.dataset.archiveView==='archived';render();});
    main.querySelectorAll('[data-archive]').forEach(btn=>btn.onclick=()=>archiveBill(btn.dataset.archive));
    main.querySelectorAll('[data-restore]').forEach(btn=>btn.onclick=()=>archiveBill(btn.dataset.restore,true));
    main.querySelectorAll('[data-edit]').forEach(btn=>btn.addEventListener('click',()=>{
      const bill=state.bills.find(b=>b.id===btn.dataset.edit);
      BillForms.openBillForm(bill);
    }));
  }

  function openIncomeDetail(dateStr){
    const incomes=E.calculatePayments(state.bills,state.paymentOverrides,dateStr,dateStr).filter(p=>p.type==='income');
    $('#income-dialog-title').textContent='Payday · '+new Date(dateStr+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
    const body=$('#income-dialog-body');
    body.innerHTML=incomes.map(p=>{
      const source=state.bills.find(b=>b.id===p.billId);
      return `<div class="income-detail-card ${p.paid?'payment-paid':''} ${p.status==='Overdue'?'payment-overdue':''}">${paidCheck(p)}<div><h3>${esc(p.name)}</h3><p>${esc(p.category)} · ${esc(source.frequency)}</p></div><strong>+${money(p.amount)}</strong><span class="status-tag">${p.paid?'Paid':'Expected'}</span><button type="button" class="textbtn" data-income-edit="${p.id}">Edit income</button></div>`;
    }).join('')||'<p>No income scheduled for this day.</p>';
    wirePaidControls(body,()=>openIncomeDetail(dateStr));
    body.querySelectorAll('[data-income-edit]').forEach(btn=>btn.onclick=()=>{closeDialog('#income-dialog');const payment=incomes.find(p=>p.id===btn.dataset.incomeEdit);BillForms.openBillForm(state.bills.find(b=>b.id===payment.billId),payment);});
    if(!$('#income-dialog').open)$('#income-dialog').showModal();
  }
  return {renderCalendarScreen,renderBillsScreen,openDayDetail,openIncomeDetail,closeWeekPicker};
})();
