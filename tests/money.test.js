/* Run with: node tests/money.test.js  (or npm test) — no dependencies. */
'use strict';
const assert = require('assert');
const M = require('../js/money.js');

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('  ✓ ' + name); }

test('toCentavos parses pesos safely', () => {
  assert.strictEqual(M.toCentavos('1,250.50'), 125050);
  assert.strictEqual(M.toCentavos('₱ 20'), 2000);
  assert.strictEqual(M.toCentavos(0.1 + 0.2), 30);
  assert.ok(Number.isNaN(M.toCentavos('12.345')));
  assert.ok(Number.isNaN(M.toCentavos('abc')));
});

test('peso formats centavos', () => {
  assert.strictEqual(M.peso(123450), '₱1,234.50');
  assert.strictEqual(M.peso(-5000), '−₱50.00');
});

test('no discount, VAT-registered: VAT is carved out of the total', () => {
  const t = M.computeTotals([{ price: 11200, qty: 1 }], { vatRegistered: true });
  assert.strictEqual(t.total, 11200);
  assert.strictEqual(t.vatable, 10000);
  assert.strictEqual(t.vat, 1200);
});

test('senior, 1 of 4 diners, VAT-registered (₱1,120 bill → ₱1,040)', () => {
  const t = M.computeTotals([{ price: 28000, qty: 4 }], { vatRegistered: true, discount: 'senior', diners: 4, idHolders: 1 });
  assert.strictEqual(t.share, 28000);
  assert.strictEqual(t.vatRemoved, 3000);
  assert.strictEqual(t.discount, 5000);
  assert.strictEqual(t.total, 104000);
  assert.strictEqual(t.vatExemptSales, 25000);
  assert.strictEqual(t.vatable + t.vat, 84000);
});

test('PWD dining alone, non-VAT seller: plain 20% off', () => {
  const t = M.computeTotals([{ price: 13500, qty: 1 }, { price: 2000, qty: 1 }], { vatRegistered: false, discount: 'pwd', diners: 1, idHolders: 1 });
  assert.strictEqual(t.gross, 15500);
  assert.strictEqual(t.discount, 3100);
  assert.strictEqual(t.vatRemoved, 0);
  assert.strictEqual(t.total, 12400);
  assert.strictEqual(t.vat, 0);
});

test('ID holders are clamped to the number of diners', () => {
  const t = M.computeTotals([{ price: 10000, qty: 1 }], { discount: 'senior', diners: 2, idHolders: 5 });
  assert.strictEqual(t.idHolders, 2);
  assert.strictEqual(t.share, 10000);
});

test('change and quick-cash suggestions', () => {
  assert.deepStrictEqual(M.change(104000, 110000), { ok: true, change: 6000, short: 0 });
  assert.deepStrictEqual(M.change(104000, 100000), { ok: false, change: 0, short: 4000 });
  assert.deepStrictEqual(M.quickCash(104000), [104000, 105000, 110000, 150000, 200000]);
});

test('summarize skips voided orders', () => {
  const mk = (no, total, method, status) => ({
    no, ts: Date.UTC(2026, 9, 14, 2), type: 'dine', method, status,
    lines: [{ name: 'Turon', price: total, qty: 1 }],
    totals: { gross: total, discount: 0, vatRemoved: 0, total, discountKind: 'none' }
  });
  const s = M.summarize([mk('K-1', 5000, 'cash', 'paid'), mk('K-2', 3000, 'ewallet', 'paid'), mk('K-3', 9999, 'cash', 'void')]);
  assert.strictEqual(s.count, 2);
  assert.strictEqual(s.voided, 1);
  assert.strictEqual(s.net, 8000);
  assert.strictEqual(s.byMethod.cash, 5000);
  assert.strictEqual(s.avgTicket, 4000);
});

test('CSV escapes quotes and formula injection', () => {
  const csv = M.toCSV([{
    no: 'K-1', ts: 0, type: 'take', method: 'cash', status: 'paid', ref: '=HYPERLINK("x")',
    lines: [{ name: 'Pancit "Special"', price: 100, qty: 2 }],
    totals: { gross: 200, discount: 0, vatRemoved: 0, total: 200, discountKind: 'none' }
  }]);
  assert.ok(csv.includes('"2x Pancit ""Special"""'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
});

console.log('\n' + passed + ' tests passed');
