/**
 * Build a single-file copy of the app (inline CSS + JS):
 *   demo/index.html      full standalone page (works from file:// too)
 *   dist/showcase.html   body fragment for hosts that add their own <html>/<head>
 * Usage: node scripts/build-demo.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const html = read('index.html');
const app = html.split('<!--APP-START-->')[1].split('<!--APP-END-->')[0].trim();
const css = read('css/styles.css');
const js = ['js/money.js', 'js/store.js', 'js/menu-sample.js', 'js/app.js'].map(read).join('\n');
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=JetBrains+Mono:wght@500;700&display=swap">';
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');

const demo = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Kahera POS · Demo</title>
<meta name="description" content="Live demo of Kahera, a free offline-first POS for Philippine cafés and karinderyas.">
<meta name="theme-color" content="#136a48">
${fonts}
<style>
${css}
</style>
</head>
<body>
${app}
<script>
${safe(js)}
</script>
</body>
</html>
`;

// The hosted showcase cannot start downloads, so it keeps only "Copy CSV".
const appNoDownload = app.replace('data-k="dlCsv">', 'data-k="dlCsv" hidden>');
const fragment = `<title>Showcase · Kahera POS</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
<style>
${css}
</style>
${appNoDownload}
<script>
${safe(js)}
</script>
`;

fs.mkdirSync(path.join(ROOT, 'demo'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'demo/index.html'), demo);
fs.writeFileSync(path.join(ROOT, 'dist/showcase.html'), fragment);
console.log('Built demo/index.html (' + demo.length + ' bytes) and dist/showcase.html');
