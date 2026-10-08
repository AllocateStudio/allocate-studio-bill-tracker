# Allocate Studio — Bill Tracker

A local-first bill and income calendar, sold as an Etsy template. Vanilla HTML/CSS/JS, no build step, no backend — everything runs in the buyer's browser and saves to `localStorage`.

## Run it

Open `index.html` directly in a browser, or serve the folder with any static file server. No install, no dependencies.

`demo.html` is a separate preview entry point with its own sample data and its own `localStorage` key, so it never touches a buyer's real calendar.

## Files

| File | Purpose |
| --- | --- |
| `index.html` / `demo.html` | App shell and dialog markup for the real app and the demo |
| `engine.js` | Recurrence math, payment status, totals — framework-free, no DOM |
| `app.js` | State, `localStorage` persistence, settings, categories, render orchestration |
| `calendar.js` | Calendar/Bills/Income screen rendering, day and week views |
| `forms.js` | Add/edit bill and income dialog, including the "this payment only" vs "this and following" edit scope |
| `guide.js` | In-app Help & guide content |
| `month-picker.js` | Month/year picker, ported from Allocate Studio Ultimate Budget |
| `demo.js` | Demo's sample bills and income |
| `styles.css` | All styling |
| `assets/` | Bundled offline fonts (OFL-licensed) and the Allocate Studio logo |
| `START-HERE.txt` | Buyer-facing quick-start instructions, shipped with the product |

## Data & privacy

No network calls, no analytics, no accounts. A buyer's calendar lives only in their browser's `localStorage`; `Export`/`Import` in-app move it as a JSON file.

## Status

`index.html` starts empty for every new visitor/buyer. `demo.html` links back to it, and `index.html` links to `demo.html` for anyone who wants to see an example first.

## Buyer handoff and updates

Ship the app files, `assets/`, `demo.html`, `demo.js` and `START-HERE.txt` together.
Exclude `.git`, internal tests and any exported personal JSON backups. Keep
`index.html` empty on first use; existing browser data must remain intact.

Buyers extract the complete ZIP and open `index.html` in a browser. For updates
or a new device/location, export from the old version, open the new copy, import
the JSON, and verify entries before removing the old copy. Import replaces data,
so export any destination data first. Local files and hosted versions do not
share storage automatically. Recovery copies retain the latest 10 snapshots
in browser storage; they do not replace downloaded backups.

## Interface terminology

Expenses are **Paid**; income is **Received** and is not crossed out. Summary
cards cover the displayed month or week and exclude income. Names update across
linked schedule history; date/amount changes follow the selected edit scope.
