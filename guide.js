/* Allocate Studio guide: the same numbered, example-led format as Ultimate Budget. */
'use strict';
const BillGuide=(()=>{
  const sections=[
    ['Start here',`
      <p>Add your bills and income, give each a date, and mark it Paid when it's done.</p>
      <ol><li>Open <b>Settings</b> — set your currency symbol and first day of the week.</li><li>Click <b>+</b> to add a bill: category, amount, frequency, first due date.</li><li>Add income the same way, choosing <b>Income</b> in Category.</li><li>Open <b>Calendar</b> and click a bill or Payday to mark it Paid.</li><li>Use <b>Export</b> to back up your calendar.</li></ol>
      <p>Dates, totals and payment progress update automatically — no formulas to manage.</p>
      <h3>Try this example</h3><p>Add Internet under Bills, $50, Monthly, with a first due date. Open it in the calendar and tick its checkbox — it's crossed out and the Paid total rises by $50.</p>`],
    ['Settings & categories',`
      <p>Open <b>Settings</b>, choose your currency (or Other for a custom symbol) and Monday/Sunday, then <b>Save settings</b>. The symbol only changes the display — it doesn't convert amounts.</p>
      <p>Start with five categories, each with its own colour:</p>
      <ul><li><b>Income:</b> salary, freelance and other money in. Acid green.</li><li><b>Bills:</b> rent, utilities, regular bills. Pink.</li><li><b>Subscriptions:</b> memberships and recurring services. Blue.</li><li><b>Debt:</b> scheduled repayments. Pale yellow.</li><li><b>Other:</b> other planned outgoings. Pale green.</li></ul>
      <p>In <b>Settings → Categories</b>, rename a category, choose a colour, or click <b>+ Add category</b> for a new expense category. Click <b>Save settings</b>. Renaming updates all linked entries, including history; dates, amounts and Paid marks stay the same. Income remains one category, even if you rename it.</p><p>Category decides income vs. outgoing — there's no separate Type field. Give each entry its own name, like Rent or Studio salary.</p>
      <h3>Try this example</h3><p>Choose Subscriptions for Netflix, Income for your salary — colour and name together tell you exactly what each entry is.</p>`],
    ['Add bills & set up repeats',`
      <p>Click <b>+</b>, enter name, category, amount, frequency and first due date (plus a last due date if needed), then <b>Save bill</b>.</p>
      <ul><li><b>Weekly / Every 2 Weeks / Every 4 Weeks:</b> every 7, 14 or 28 days.</li><li><b>Monthly / Every 2, 3, 6 Months / Yearly:</b> by calendar month.</li><li><b>One-Time:</b> appears once, on the date you choose.</li><li><b>Last due date:</b> optional, inclusive — leave blank for an ongoing schedule.</li></ul>
      <p>A monthly bill set for the 31st uses the last day of shorter months, then returns to the 31st when available. Creating a schedule doesn't mark it Paid.</p>
      <h3>Try this example</h3><p>Add a $90 water bill, Every 3 Months, first date January 31 — it lands on Jan 31, Apr 30, Jul 31, Oct 31.</p>`],
    ['Income & Payday',`
      <p>Click <b>+</b>, choose <b>Income</b> in Category, enter source, amount, frequency and first payday, then <b>Save income</b>. (Opening the Income tab first selects Income for you.)</p>
      <p>Income shows as a green <b>Payday</b> band. Click it to see names and amounts — several sources on the same day appear together.</p>
      <p>Tick each payment when received; the Payday label crosses out once all that day's income is Paid. Income stays separate from bill totals.</p>
      <p>For two fixed paydays a month, add two Monthly entries — not Every 2 Weeks, which repeats every 14 days.</p>
      <h3>Try this example</h3><p>Salary on the 5th and 20th: add two Monthly income entries. When the first arrives, mark only that occurrence Paid.</p>`],
    ['Find your month & read the calendar',`
      <p>Switch <b>Month</b>/<b>Week</b>. Step with ‹ › in either view.</p>
      <p>In Month view, click the month/year button (e.g. <b>Oct 2026</b>) to open the picker — step with ‹ ›, tap the year to jump by decade, pick a month directly, or choose <b>Today</b> to return to now. In Week view, click the date button to open a mini calendar and jump to the week containing any date, or choose <b>Today</b> there to return to this week.</p>
      <p>Click a bill or its day to see all entries for that date. “+ more” means there's more inside; cramped amounts always show in full there.</p>
      <ul><li><b>Paid:</b> crossed out.</li><li><b>Overdue:</b> burgundy — past due and unpaid.</li><li><b>Upcoming:</b> ordinary text — due today or later, not yet Paid.</li></ul>
      <p>Untick a checkbox to undo a Paid mark. Unreceived income can also show as Overdue once its date passes.</p>
      <h3>Try this example</h3><p>Open an unpaid bill in a past month and tick Paid — its burgundy name becomes a crossed-out entry.</p>`],
    ['Totals, filters & the next 7 days',`
      <p>The four cards describe the month in the heading (even in Week view across two months). Income is excluded.</p>
      <ul><li><b>Due this month:</b> all scheduled outgoings, Paid or not.</li><li><b>Paid:</b> the Paid portion of those.</li><li><b>Remaining:</b> Due this month minus Paid.</li><li><b>Overdue:</b> unpaid, dated before today.</li></ul>
      <p><b>Payment progress</b> is Paid ÷ Due this month — by amount, not bill count.</p>
      <p><b>All / Unpaid / Overdue</b> filter what's shown (including income) without changing the totals. Open a day to see everything and undo a Paid mark if needed.</p>
      <p><b>Due in the next 7 days</b> counts unpaid outgoings from today through the next six days — no income, no already-Paid or older-overdue bills. Stays anchored to today even when you browse other months.</p>
      <h3>Try this example</h3><p>$1,000 of bills, $400 Paid: Remaining $600, progress 40%. Unpaid just hides the paid entries — totals don't change.</p>`],
    ['Edit one payment or future payments',`
      <p>Open the payment in Calendar and click <b>Adjust</b> (for income: Payday → <b>Edit income</b>). Under <b>Apply changes to</b>:</p>
      <p>To change a name, edit the name field and save the entry. This updates linked history and future payments without changing their amounts, dates or Paid marks.</p><ul><li><b>Only this payment:</b> changes this occurrence's amount or date. Name, category and schedule stay the same.</li><li><b>This and following payments:</b> changes this occurrence onward. Earlier payments and their Paid marks are untouched.</li></ul>
      <p>Save when done — moving a payment's date also moves it to that calendar day.</p>
      <p>Editing from <b>Bills</b>/<b>Income</b> starts at the next occurrence (or the last, if the schedule ended). Use Calendar to pick a specific payment instead. Earlier segments stay visible in Calendar even after a future change, though they drop off the management list.</p>
      <h3>Try this example</h3><p>Internet is $50 through October, $60 from November: open November, choose This and following payments, enter $60, save — October stays $50. For a one-off $5 surcharge, use Only this payment instead.</p>`],
    ['Keep paid payments protected',`
      <p>Future schedule changes protect Paid dates and amounts — a new amount only applies to unpaid occurrences.</p>
      <p>If a frequency, date or end-date change would affect a Paid occurrence, the save is blocked and the app tells you a safe date to start from instead. Nothing changes until you do.</p>
      <p>Close the form, reopen that later payment in Calendar, and choose This and following payments from there. No later occurrence? Add a new schedule after the protected date. To correct a Paid payment itself, use Only this payment.</p>
      <p>Individually adjusted unpaid payments keep their adjustments through a schedule change — worth reviewing afterward.</p>
      <h3>Try this example</h3><p>November is already Paid and you try switching to Weekly from October — the app won't reassign November's Paid mark to a different weekly date. It asks you to start after that protected payment instead.</p>`],
    ['Archive, restore or stop a schedule',`
      <p>Use <b>Archive</b> (in the Bills/Income list or its edit form) when you no longer want future unpaid payments.</p>
      <p>Archiving stops unpaid occurrences after today — earlier and today's payments, and any paid-in-advance records, stay in Calendar. The schedule moves from <b>Active</b> to <b>Archived</b>.</p>
      <p>Open <b>Archived</b> and click <b>Restore</b> to bring it back; unpaid dates since archiving reappear and may now be overdue (the confirmation explains this). Restore before editing future payments — individual past payments can still be corrected through Calendar either way.</p>
      <p>To finish a bill for good, open the occurrence to change from, choose <b>This and following payments</b>, and set its <b>Last due date</b> (inclusive — nothing generates after it). An end date that would remove a Paid or adjusted future payment is blocked.</p>
      <p><b>Delete bill</b>/<b>Delete income</b> removes that schedule and its history after confirmation. Earlier segments from previous edits are separate schedules and stay. Export a backup first if you might need the deleted records.</p>
      <h3>Try this example</h3><p>Stopped using a subscription today? Click Archive — its records stay visible. Ending after December instead? Keep it active, open December, choose This and following payments, and set Last due date to that payment's date.</p>`],
    ['Saving, backups & another device',`
      <p>Your calendar saves in this browser, on this device — no cloud, bank link or cross-device sync. Keep using the same browser and app folder.</p>
      <ol><li>Save each form as you go.</li><li>Click <b>Export</b> to download a JSON backup.</li><li>Keep dated copies somewhere findable.</li><li>To restore, click <b>Import</b>, choose a Bill Tracker JSON backup, confirm.</li></ol>
      <p>Import replaces, not merges — export first if you need to keep the current calendar. A Budget app backup, spreadsheet, HTML file or ZIP won't work here.</p>
      <p>Keep the app folder too — the JSON holds your data, not the app itself. To move devices, open the app there and import your backup; separate devices don't sync.</p>
      <p>Clearing browser data, private browsing, or moving the app folder can affect saved records. Backups hold readable financial data — keep them private.</p>
      <h3>Try this example</h3><p>After entering your bills, Export and confirm the JSON downloaded — keep that copy before making several schedule changes.</p>`],
    ['Recovery copies & saving paused',`
      <p>The app keeps up to 10 recovery copies before risky actions like importing, archiving, restoring, deleting or editing a schedule. In <b>Settings</b>, download one as JSON — downloading doesn't restore it, use Import after.</p>
      <p>Recovery copies live in the same browser storage as your calendar — handy for undoing a change, but not a substitute for downloaded backups. If one can't be created, the protected action is stopped.</p>
      <p>If you see <b>Saving paused</b>, read the warning before closing or reloading — another tab may have changed the calendar, or storage may be unavailable. Export anything unsaved; for a tab conflict, stick to one tab and reload after. A failed save hasn't committed — keep the form open until it's resolved.</p>
      <h3>Try this example</h3><p>Imported the wrong calendar? Open Settings, download the recovery copy from before the import, then Import it to restore. Double-check names, dates and recent Paid marks after.</p>`],
    ['Demo & quick troubleshooting',`
      <p>This preview edition adds example bills and income once; existing entries stay, and deleted examples don't return. The separate <b>demo.html</b> has its own saved data.</p>
      <ul><li><b>Payment missing:</b> choose All, check the month, and its first/last date or any individual adjustment.</li><li><b>Total looks small:</b> income is excluded; a moved payment counts in its new month.</li><li><b>Bill appears twice:</b> check for two schedules or a One-Time entry before deleting anything.</li><li><b>Next 7 days ≠ Remaining:</b> the first is today + 6 days; Remaining is the whole heading month.</li><li><b>Paid payment needs fixing:</b> open its date, use Only this payment, or untick Paid if marked by mistake.</li></ul>
      <p>The app tracks your plan and payment status — it doesn't send reminders, connect to your bank, or make payments.</p>
      <p>For template help, contact Allocate Studio through Etsy Messages.</p>
      <h3>Try this example</h3><p>Rent missing? Choose All, open its expected month, check if its date moved. Export a backup before deleting a suspected duplicate.</p>`]
  ];
  function render(main){
    main.innerHTML=`<section class="guide-heading"><h1>Help &amp; guide</h1><p>Everything you need to get started with Bill Tracker.</p></section><section class="guide-panel" aria-label="Bill Tracker instructions"><h2>Your calendar, step by step</h2>${sections.map(([title,body],i)=>`<details class="guide-section" ${i===0?'open':''}><summary><span class="guide-number">${String(i+1).padStart(2,'0')}</span><span>${title}</span></summary><div class="guide-copy">${body}</div></details>`).join('')}</section>`;
  }
  return {render};
})();
