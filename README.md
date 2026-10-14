# Kahera POS

**A free, offline-first point-of-sale screen for Philippine cafés and karinderyas that gets Senior/PWD discounts right every time.**

![Version](https://img.shields.io/badge/version-1.0.0-136a48)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Vanilla JS](https://img.shields.io/badge/vanilla-JS-f7df1e)
![PWA](https://img.shields.io/badge/PWA-offline-5a0fc8)
![No build step](https://img.shields.io/badge/build-none-lightgrey)

**Live demo:** https://efraimray.github.io/kahera-pos/ · single-file copy: https://efraimray.github.io/kahera-pos/demo/

> **Screenshot:** add `docs/screenshot.png` (Register tab at 1280×800) after publishing and reference it here.

*Kahera* is Filipino for *cashier*. Many small food businesses still total orders on a calculator and compute the senior citizen discount by hand, which is slow at lunch rush and easy to get wrong once VAT is involved. Kahera runs in any browser, installs on a tablet like an app, works without internet, and does the discount math in integer centavos so totals never drift.

---

## Features

- **Tap-to-add register** with search (press `/`), category chips, sold-out items and quantity badges.
- **Senior / PWD discount, pro-rated:** 20% off each ID holder's equal share of the bill. For VAT-registered sellers the 12% VAT is removed from that share first, as Philippine rules require.
- **Cash, e-wallet and card** payments: quick-bill buttons (exact, ₱20/₱50/₱100/₱500/₱1,000 rounding), live change or "still needed", reference numbers for cashless payments.
- **Order slip** clearly labelled *not an official receipt*.
- **Orders list** with a two-step void and slip reprint.
- **Shift summary:** net sales, average ticket, discounts given, sales by hour, payment mix, top items.
- **CSV export** (copy or download), protected against spreadsheet formula injection.
- **Menu editor:** rename, re-price, mark sold out, add or delete items; VAT-registered toggle.
- **Offline PWA:** service worker cache + web manifest ("Add to Home Screen").
- **Light and dark themes**, keyboard-friendly, reduced-motion aware.

## Tech Stack

| Layer | Choice |
| --- | --- |
| UI | Semantic HTML, modern CSS (grid, custom properties), vanilla JavaScript (ES5-compatible IIFEs) |
| Money math | `js/money.js`: pure functions, integer centavos, UMD so it runs in browsers and Node |
| Storage | `localStorage` behind `js/store.js` with an in-memory fallback |
| Offline | Service worker (`sw.js`) + `manifest.webmanifest` |
| Tests | Plain Node `assert` (`npm test`), no dependencies |
| Fonts | Bricolage Grotesque, Atkinson Hyperlegible, JetBrains Mono (Google Fonts, with system fallbacks) |

## Folder Structure

```text
kahera-pos/
├── index.html              # the app (GitHub Pages serves this at the root)
├── css/styles.css          # design tokens, light/dark themes, layout
├── js/
│   ├── money.js            # totals, Senior/PWD + VAT, change, summary, CSV (pure)
│   ├── store.js            # safe localStorage wrapper
│   ├── menu-sample.js      # sample café menu, settings and seed orders
│   └── app.js              # UI controller: rendering + event delegation
├── sw.js                   # offline cache
├── manifest.webmanifest    # PWA manifest
├── icons/icon.svg
├── demo/index.html         # single-file build (CSS + JS inlined)
├── scripts/build-demo.js   # builds demo/index.html
├── tests/money.test.js     # unit tests for money.js
├── docs/TUTORIAL.md
├── docs/DEPLOYMENT.md
├── CHANGELOG.md
└── LICENSE
```

## Quick Start

```bash
git clone https://github.com/EfraimRay/kahera-pos.git
cd kahera-pos
npm test            # 9 money tests, no install needed
npx serve .         # open http://localhost:3000
```

You can also double-click `index.html`. Everything works from `file://` except the offline service worker, which needs `http://` or `https://`.

## Usage

1. **Register:** tap menu tiles to add them. Use − / + on a line to change quantity.
2. **Senior / PWD:** open the discount panel, choose *Senior* or *PWD*, then set **Diners** (everyone sharing the bill) and **With ID** (how many present a valid ID).
3. **Charge:** pick Cash, E-wallet or Card. For cash, tap a quick-bill button or type the amount; the change updates live. Press **Enter** or **Complete sale**.
4. **Orders:** reprint a slip or void a sale (two-step confirmation).
5. **Shift:** review totals, then **Copy CSV** or **Download CSV** and **Start new shift**.
6. **Menu:** edit items and prices, set your business name, and switch VAT-registered on or off.

### How the discount is computed

```
share      = bill × (ID holders ÷ diners)
VAT-exempt = share ÷ 1.12               (VAT-registered sellers only)
discount   = 20% × VAT-exempt share
total      = (bill − share) + (VAT-exempt share − discount)
```

Example: ₱1,120 bill, 4 diners, 1 senior, VAT-registered → share ₱280, less VAT ₱30, less 20% ₱50, **total ₱1,040**.

## Configuration

| What | Where |
| --- | --- |
| Starting menu, categories, business name | `js/menu-sample.js` |
| VAT and discount rates | `VAT_RATE`, `SC_PWD_RATE` in `js/money.js` |
| Colors, fonts, radius | CSS custom properties at the top of `css/styles.css` |
| Offline cache version | `CACHE` in `sw.js` (bump it on every release) |
| Storage key prefix | `PREFIX` in `js/store.js` |

## Deployment

Static hosting only, no server. See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for GitHub Pages, Netlify, Vercel and Cloudflare Pages, plus publishing with GitHub Desktop or the git CLI and tagging releases.

## Customization

- **Brand it:** change `--accent` and the fonts in `css/styles.css`, and the SVG in `icons/icon.svg`.
- **New payment method:** add a button in the `method` radiogroup in `index.html`, a label in `METHOD_LABEL` (`js/app.js`) and a key in `summarize().byMethod` (`js/money.js`).
- **Another discount** (e.g. employee 10%): extend `computeTotals()` and add a test first.
- **Rebuild the single-file demo** after any change: `npm run build`.

## Roadmap

- [ ] **v1.1:** item modifiers and notes (less ice, extra rice), plus "undo clear".
- [ ] **v1.2:** kitchen display view and order queue ("Preparing / Ready").
- [ ] **v1.3:** inventory counts with low-stock warnings per item.
- [ ] **v2.0:** optional cloud sync across branches (Supabase or a small PHP API).

## Contributing

Issues and pull requests are welcome. Please keep it dependency-free, run `npm test` and `npm run check`, and add a test for any change to `money.js`.

## Requesting improvements

Open an issue on this repository with the label **`claude-improve`** and describe what you want. Requests with that label are picked up by the nightly showcase run, implemented, tested, released as a new version and closed with a comment.

## Important notes

The café, menu and orders are sample data. Order slips are **not** official receipts: a business that issues receipts or invoices needs a BIR-registered POS or accredited system. Discount rules differ by business type (for example, groceries use a 5% basic-necessities discount instead), so confirm with your accountant before using it for real sales.

## License

[MIT](LICENSE) © 2026 Efraim Ray

## Author

**Efraim Ray**: web developer and AI automation specialist, Valencia City, Bukidnon, Philippines.
Website: https://www.efraimray.com/ · GitHub: [@EfraimRay](https://github.com/EfraimRay)
