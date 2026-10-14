/**
 * Kahera POS — menu-sample.js
 * Sample data for a fictional café. Replace with your own menu in the
 * Menu tab (saved in the browser) or by editing this file before deploying.
 * Prices are VAT-inclusive and stored in centavos (₱65.00 = 6500).
 */
(function (root) {
  'use strict';
  root.KAHERA_SAMPLE = {
    settings: {
      bizName: 'Kapehan sa Lantaw',
      bizNote: 'Sample café · Valencia City, Bukidnon',
      vatRegistered: true
    },
    categories: [
      { id: 'drinks', name: 'Drinks' },
      { id: 'meals', name: 'Rice meals' },
      { id: 'merienda', name: 'Merienda' },
      { id: 'extras', name: 'Extras' }
    ],
    menu: [
      { id: 'm01', cat: 'drinks', name: 'Kapeng Barako', price: 6500, available: true },
      { id: 'm02', cat: 'drinks', name: 'Iced Spanish Latte', price: 12000, available: true },
      { id: 'm03', cat: 'drinks', name: 'Tablea Hot Choco', price: 7500, available: true },
      { id: 'm04', cat: 'drinks', name: 'Calamansi Juice', price: 5500, available: true },
      { id: 'm05', cat: 'meals', name: 'Chicken Adobo', price: 13500, available: true },
      { id: 'm06', cat: 'meals', name: 'Pork Sinigang', price: 16500, available: true },
      { id: 'm07', cat: 'meals', name: 'Tapsilog', price: 14500, available: true },
      { id: 'm08', cat: 'meals', name: 'Bangus Sisig', price: 15000, available: true },
      { id: 'm09', cat: 'meals', name: 'Pancit Bihon (for 2)', price: 18000, available: false },
      { id: 'm10', cat: 'merienda', name: 'Turon', price: 2500, available: true },
      { id: 'm11', cat: 'merienda', name: 'Puto Maya & Sikwate', price: 6000, available: true },
      { id: 'm12', cat: 'merienda', name: 'Ensaymada', price: 4500, available: true },
      { id: 'm13', cat: 'merienda', name: 'Banana Cue', price: 2000, available: true },
      { id: 'm14', cat: 'extras', name: 'Extra Rice', price: 2000, available: true },
      { id: 'm15', cat: 'extras', name: 'Fried Egg', price: 1800, available: true }
    ],
    // Earlier sales so the Orders and Shift tabs open with something to show.
    // [minutes ago, type, table, [[menuId, qty]...], method, discount, diners, idHolders]
    orders: [
      [410, 'dine', '2', [['m07', 2], ['m01', 2]], 'cash', 'none', 2, 0],
      [372, 'take', '', [['m12', 6]], 'ewallet', 'none', 1, 0],
      [298, 'dine', '5', [['m05', 1], ['m06', 1], ['m14', 2], ['m04', 2]], 'cash', 'senior', 2, 1],
      [221, 'dine', '1', [['m11', 2], ['m03', 1]], 'card', 'none', 2, 0],
      [150, 'take', '', [['m02', 3], ['m10', 3]], 'ewallet', 'none', 1, 0],
      [64, 'dine', '3', [['m08', 1], ['m01', 1]], 'cash', 'pwd', 1, 1]
    ]
  };
})(typeof self !== 'undefined' ? self : this);
