/**
 * Kahera POS — money.js
 * Pure money math for the register. No DOM access, so it runs in the browser
 * (as window.KaheraMoney) and in Node (require('./js/money.js')) for tests.
 *
 * Every amount is an INTEGER number of centavos (₱1.00 = 100). Floating-point
 * pesos drift (0.1 + 0.2 !== 0.3); integers do not.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KaheraMoney = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VAT_RATE = 0.12;      // Philippine VAT
  var SC_PWD_RATE = 0.20;   // Senior citizen / PWD discount (RA 9994, RA 10754)

  var fmt = (typeof Intl !== 'undefined')
    ? new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  /** Pesos (number or string like "1,250.50") → centavos. Returns NaN for junk. */
  function toCentavos(value) {
    if (typeof value === 'number') return Math.round(value * 100);
    var clean = String(value == null ? '' : value).replace(/[₱,\s]/g, '');
    if (clean === '' || !/^-?\d*(\.\d{0,2})?$/.test(clean)) return NaN;
    return Math.round(parseFloat(clean) * 100);
  }

  /** Centavos → "₱1,234.50" (or "1,234.50" with { symbol: false }). */
  function peso(centavos, opts) {
    var c = Math.round(Number(centavos) || 0);
    var sign = c < 0 ? '−' : '';
    var abs = Math.abs(c) / 100;
    var text = fmt ? fmt.format(abs) : abs.toFixed(2);
    var sym = (opts && opts.symbol === false) ? '' : '₱';
    return sign + sym + text;
  }

  function clampInt(n, min, max) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = min;
    return Math.min(max, Math.max(min, n));
  }

  /** Sum of price × qty for cart lines [{ price, qty }]. */
  function subtotal(lines) {
    return (lines || []).reduce(function (sum, l) {
      return sum + Math.round(l.price) * clampInt(l.qty, 0, 9999);
    }, 0);
  }

  function itemCount(lines) {
    return (lines || []).reduce(function (n, l) { return n + clampInt(l.qty, 0, 9999); }, 0);
  }

  /**
   * Compute the bill.
   *
   * Menu prices are VAT-inclusive. For a Senior/PWD discount the ID holders'
   * share is pro-rated by headcount (e.g. 1 of 4 diners → 25% of the bill).
   * For a VAT-registered seller that share is first made VAT-exempt
   * (÷ 1.12), then discounted 20%. A non-VAT seller just takes 20% off.
   *
   * @param {Array}  lines  [{ price (centavos), qty }]
   * @param {Object} opts   { vatRegistered, discount: 'none'|'senior'|'pwd', diners, idHolders }
   * @return {Object} all amounts in centavos
   */
  function computeTotals(lines, opts) {
    opts = opts || {};
    var vatReg = opts.vatRegistered !== false;
    var gross = subtotal(lines);
    var diners = clampInt(opts.diners, 1, 99);
    var holders = clampInt(opts.idHolders, 0, diners);
    var kind = (opts.discount === 'senior' || opts.discount === 'pwd') ? opts.discount : 'none';

    var r = {
      gross: gross, items: itemCount(lines), discountKind: 'none', diners: diners, idHolders: 0,
      share: 0, vatRemoved: 0, discount: 0, vatable: 0, vat: 0, vatExemptSales: 0,
      total: gross, vatRegistered: vatReg
    };

    var regular = gross;
    if (kind !== 'none' && holders > 0 && gross > 0) {
      var share = Math.round(gross * holders / diners);
      var base = vatReg ? Math.round(share / (1 + VAT_RATE)) : share;
      var disc = Math.round(base * SC_PWD_RATE);
      regular = gross - share;
      r.discountKind = kind;
      r.idHolders = holders;
      r.share = share;
      r.vatRemoved = share - base;
      r.discount = disc;
      r.vatExemptSales = vatReg ? base : 0;
      r.total = regular + (base - disc);
    }

    if (vatReg) {
      r.vatable = Math.round(regular / (1 + VAT_RATE));
      r.vat = regular - r.vatable;
    }
    return r;
  }

  /** Cash change. { ok, change, short } in centavos. */
  function change(total, tendered) {
    var t = Math.round(Number(tendered));
    if (isNaN(t)) return { ok: false, change: 0, short: total };
    return t >= total ? { ok: true, change: t - total, short: 0 } : { ok: false, change: 0, short: total - t };
  }

  /** Bills a customer is likely to hand over: exact, then rounded up to 20/50/100/500/1000. */
  function quickCash(total) {
    if (total <= 0) return [];
    var steps = [2000, 5000, 10000, 50000, 100000];
    var out = [total];
    steps.forEach(function (s) {
      var v = Math.ceil(total / s) * s;
      if (out.indexOf(v) === -1) out.push(v);
    });
    return out.sort(function (a, b) { return a - b; }).slice(0, 5);
  }

  /** Shift summary for a list of saved orders. Voided orders are counted but excluded from sales. */
  function summarize(orders) {
    var s = {
      count: 0, voided: 0, gross: 0, discounts: 0, vatRemoved: 0, net: 0, avgTicket: 0,
      byMethod: { cash: 0, ewallet: 0, card: 0 }, byHour: {}, topItems: []
    };
    var items = {};
    (orders || []).forEach(function (o) {
      if (o.status === 'void') { s.voided++; return; }
      s.count++;
      s.gross += o.totals.gross;
      s.discounts += o.totals.discount;
      s.vatRemoved += o.totals.vatRemoved;
      s.net += o.totals.total;
      s.byMethod[o.method] = (s.byMethod[o.method] || 0) + o.totals.total;
      var h = new Date(o.ts).getHours();
      s.byHour[h] = (s.byHour[h] || 0) + o.totals.total;
      o.lines.forEach(function (l) {
        var it = items[l.name] || (items[l.name] = { name: l.name, qty: 0, amount: 0 });
        it.qty += l.qty;
        it.amount += l.price * l.qty;
      });
    });
    s.avgTicket = s.count ? Math.round(s.net / s.count) : 0;
    s.topItems = Object.keys(items).map(function (k) { return items[k]; })
      .sort(function (a, b) { return b.qty - a.qty || b.amount - a.amount; });
    return s;
  }

  function csvCell(v) {
    var t = String(v == null ? '' : v);
    // Neutralise spreadsheet formula injection and quote when needed.
    if (/^[=+\-@]/.test(t)) t = "'" + t;
    return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }

  /** Orders → CSV text (amounts in pesos with 2 decimals). */
  function toCSV(orders) {
    var head = ['order_no', 'date_time', 'type', 'table', 'items', 'gross', 'discount_type', 'discount', 'vat_removed', 'total', 'method', 'reference', 'status'];
    var rows = (orders || []).map(function (o) {
      var p = function (c) { return (c / 100).toFixed(2); };
      return [
        o.no, new Date(o.ts).toISOString(), o.type, o.table || '',
        o.lines.map(function (l) { return l.qty + 'x ' + l.name; }).join('; '),
        p(o.totals.gross), o.totals.discountKind, p(o.totals.discount), p(o.totals.vatRemoved),
        p(o.totals.total), o.method, o.ref || '', o.status
      ].map(csvCell).join(',');
    });
    return head.join(',') + '\n' + rows.join('\n') + (rows.length ? '\n' : '');
  }

  return {
    VAT_RATE: VAT_RATE, SC_PWD_RATE: SC_PWD_RATE,
    toCentavos: toCentavos, peso: peso, subtotal: subtotal, itemCount: itemCount,
    computeTotals: computeTotals, change: change, quickCash: quickCash,
    summarize: summarize, toCSV: toCSV
  };
});
