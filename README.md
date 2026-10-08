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
| `demo.js` / `sample-data.js` / `seed-current.js` | Demo and first-run sample data |
| `styles.css` | All styling |
| `assets/` | Bundled offline fonts (OFL-licensed) and the Allocate Studio logo |
| `START-HERE.txt` | Buyer-facing quick-start instructions, shipped with the product |

## Data & privacy

No network calls, no analytics, no accounts. A buyer's calendar lives only in their browser's `localStorage`; `Export`/`Import` in-app move it as a JSON file.

## Status

Preview edition — see `START-HERE.txt` for what that means for sample data on first open.
