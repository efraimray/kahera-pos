# Kahera POS Tutorial

This guide walks you through how Kahera works, file by file, so you can change it with confidence. It assumes you know basic HTML, CSS and JavaScript.

## 1. Architecture at a glance

```text
 index.html  ──loads──►  money.js   (pure math, no DOM)
                         store.js   (localStorage wrapper)
                         menu-sample.js (starting data)
                         app.js     (UI: reads state, renders HTML, handles clicks)
 sw.js       ──caches──► all of the above for offline use
```

The rule that keeps it simple: **`money.js` never touches the page, and `app.js` never does money math by itself.** That separation is what lets us unit-test the part that matters most (the totals) in plain Node.

The app has one state object `S` in `app.js`:

```js
S.settings  // { bizName, bizNote, vatRegistered }
S.menu      // [{ id, cat, name, price (centavos), available }]
S.cart      // { type, table, lines:[{id,name,price,qty}], disc, diners, ids }
S.orders    // completed sales
S.seq       // last order number used
S.view      // which tab is open
```

Every user action changes `S`, saves the part that changed through `store.set()`, then calls a `render…()` function that rebuilds that part of the screen. There is no virtual DOM and no framework; the screens are small enough that re-rendering a list is instant.

## 2. Key concept: money in centavos

JavaScript numbers are floating point, so `0.1 + 0.2` is `0.30000000000000004`. A POS that adds pesos as decimals will eventually be one centavo off. Kahera stores every amount as an **integer number of centavos**: ₱65.00 is `6500`. We only convert to pesos when showing text (`M.peso(6500)` → `"₱65.00"`) or reading input (`M.toCentavos("65.50")` → `6550`).

## 3. `js/money.js`

It uses the UMD pattern so the same file works in both places:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); // Node
  else root.KaheraMoney = factory();                                            // browser
})(this, function () { /* ... */ });
```

Main functions:

| Function | What it does |
| --- | --- |
| `toCentavos(value)` | Parses `"1,250.50"` or `"₱ 20"` to centavos; returns `NaN` for invalid input |
| `peso(c, {symbol})` | Formats centavos with `Intl.NumberFormat('en-PH')` |
| `computeTotals(lines, opts)` | The bill: gross, Senior/PWD share, VAT removed, discount, VATable sales, VAT, total |
| `change(total, tendered)` | `{ ok, change, short }` |
| `quickCash(total)` | Likely bills: exact, then rounded up to ₱20/₱50/₱100/₱500/₱1,000 |
| `summarize(orders)` | Shift totals, by payment method, by hour, top items (voids excluded) |
| `toCSV(orders)` | Spreadsheet export with quoting and formula-injection protection |

### How `computeTotals` handles Senior/PWD

Philippine rules give seniors and PWDs 20% off **their own** consumption, and for VAT-registered sellers the sale to them is VAT-exempt. When a group shares food, their consumption is their equal share of the bill. So:

```js
var share = Math.round(gross * holders / diners);              // their part of the bill
var base  = vatReg ? Math.round(share / 1.12) : share;          // remove VAT first
var disc  = Math.round(base * 0.20);                            // then 20% off
r.total   = (gross - share) + (base - disc);                    // others pay full price
```

Rounding happens once per step on whole centavos, and the tests in `tests/money.test.js` lock in known examples.

## 4. `js/store.js`

`localStorage` can throw (private browsing, storage full, blocked cookies). Every access is wrapped in `try/catch`, and a `mem` object keeps a copy so the app still works for the session even when nothing can be saved. Keys are prefixed `kahera:v1:` so a future data format can use `v2` without clashing.

## 5. `js/menu-sample.js`

Plain data: categories, menu items and six seed orders written as compact arrays `[minutesAgo, type, table, [[itemId, qty]], method, discount, diners, idHolders]`. `app.js` turns them into real orders on first load so the Orders and Shift tabs have something to show. Replace this file with your client's menu before deploying.

## 6. `js/app.js`

Read it top to bottom in this order:

1. **Helpers:** `$(k)` finds `[data-k="k"]` inside the app; `esc()` escapes text before it goes into `innerHTML` (menu names are user-editable, so this matters).
2. **`load()`:** reads saved data or falls back to the sample, and pre-fills a cart so the first screen is a working register.
3. **Render functions:** `renderGrid`, `renderCart`, `renderTotals`, `renderPay`, `renderOrders`, `renderShift`, `renderMenuAdmin`. Each builds an HTML string and sets it once.
4. **Mutations:** `addItem`, `stepLine`, `completeSale`. They change `S`, save, and re-render.
5. **`bind()`:** event delegation. One listener per container handles every button inside it via `e.target.closest('[data-add]')`. That is why re-rendering the grid never loses click handlers.

### Two-step confirmations instead of `confirm()`

Void, Start new shift and Reset use an inline "Are you sure?" row (`pendingVoid`, `pendingShift`, `pendingReset`). Browser `confirm()` dialogs are blocked in some embedded views and are easy to tap through by accident on a tablet.

### The order slip

`showSlip(order)` builds the slip HTML and opens a native `<dialog>` with `showModal()`, which gives focus trapping and the Esc key for free. The zig-zag tear edge is a CSS `mask` made from a repeating radial gradient.

## 7. `css/styles.css`

All colors are custom properties on `:root`, redefined for dark mode twice: once under `@media (prefers-color-scheme: dark)` (unless the user picked light) and once under `[data-theme="dark"]` (when the user picked dark with the theme button). Components only ever use the tokens. Layout is CSS grid: two columns on desktop, one column under 960px with a fixed "Review order" bar that respects the phone's safe-area insets.

## 8. `sw.js`

On install it caches the app shell. On fetch it answers from the cache immediately and refreshes the cache from the network in the background ("stale-while-revalidate"). When you release a new version, change `CACHE = 'kahera-v1.0.0'` so old caches are deleted on activate.

## 9. Extension exercises

1. **Employee discount.** Add a `'staff'` option that takes 10% off the whole bill without VAT changes. Write the test in `tests/money.test.js` first, then update `computeTotals`, the `disc` radiogroup in `index.html` and `DISC_LABEL` in `app.js`.
2. **Item notes.** Let the cashier add a note to a cart line ("no onions"). Store it as `line.note`, show it under the item name in `renderCart()` and on the slip in `showSlip()`. Lines with different notes should stay separate.
3. **Daily target.** Add a "Target ₱" field in Menu → Store and show a progress bar on the Shift tab comparing `summary.net` to the target. Reuse the `.split-track` / `.split-fill` styles.

Run `npm test`, `npm run check` and `npm run build` after each exercise.
