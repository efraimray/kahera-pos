# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-14

### Added
- Register screen: menu tiles with search, category chips, sold-out state and per-item quantity badges.
- Order rail with dine-in/take-out, table number, quantity steppers and live totals.
- Senior citizen / PWD discount pro-rated by headcount, with 12% VAT exemption for VAT-registered sellers.
- Payments: cash with quick-bill buttons and change, e-wallet and card with reference numbers.
- Order slip (labelled "not an official receipt"), order list with two-step void, shift summary with hourly sales, payment mix and top items.
- CSV export (copy or download) with formula-injection protection.
- Menu editor and store settings saved in the browser; reset to sample data.
- Offline PWA (service worker + manifest), light and dark themes, keyboard shortcut `/` for search.
- `money.js` unit tests (`npm test`) and a single-file demo build (`npm run build`).
