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
| `build-customer-zip.py` | Packs the buyer ZIP (bundled JS, PDFs, assets) to Desktop/etsy |

## Data & privacy

No network calls, no analytics, no accounts. A buyer's calendar lives only in their browser's `localStorage`; `Export`/`Import` in-app move it as a JSON file.

## Status

`index.html` starts empty for every new visitor/buyer. `demo.html` links back to it, and `index.html` links to `demo.html` for anyone who wants to see an example first.

## Buyer handoff and updates

All buyer-facing instructions live in the two onboarding PDFs (kept outside
this repo, in `~/Desktop/etsy/`) and the in-app Help & guide — there's no
separate instructions file shipped with the product. Run
`python3 build-customer-zip.py` to produce the sellable ZIP; it excludes
`.git`, internal tests and any exported personal JSON backups, and keeps
`index.html` empty on first use.

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
