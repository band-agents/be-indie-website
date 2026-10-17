// Assembles product.html and collection.html from their templates, injecting the
// header/footer from store.html. Run from this folder: node build.js
const fs = require('fs');

let home = fs.readFileSync('store.html', 'utf8');

// Point main navigation at the collection page (idempotent).
const nav = [
  ['New in', 'new'], ['Women', 'women'], ['Men', 'men'], ['Denim', 'denim'],
  ['Corsets', 'corsets'], ['Sale', 'sale'],
];
for (const [label, c] of nav) {
  const re = new RegExp(`<a href="#[a-z]*"( class="sale(?:-link)?"| style="[^"]*")?>${label}</a>`, 'g');
  home = home.replace(re, (m, extra) => `<a href="collection.html?c=${c}"${extra || ''}>${label}</a>`);
}
home = home.replace(/<a class="u" href="#sale">Shop the sale<\/a>/, '<a class="u" href="collection.html?c=sale">Shop the sale</a>')
  .replace(/<a class="u" href="#fit">All denim<\/a>/, '<a class="u" href="collection.html?c=denim">All denim</a>')
  .replace(/<a class="u" href="#new">View all<\/a>/, '<a class="u" href="collection.html?c=new">View all</a>');
fs.writeFileSync('store.html', home);
fs.writeFileSync('index.html', home);
fs.writeFileSync('base.css', home.match(/<style>([\s\S]*?)<\/style>/)[1]);

// Header/footer for inner pages: same-page anchors become links back to the homepage.
const fix = (h) => h.replace(/href="#([^"]*)"/g, (m, a) => `href="store.html${a ? '#' + a : ''}"`);
const header = fix(home.slice(home.indexOf('<div class="announce">'), home.indexOf('<!-- HERO -->')));
const footer = fix(home.slice(home.indexOf('<footer>'), home.indexOf('<script src="data.js">')));

for (const page of ['product', 'collection']) {
  const t = fs.readFileSync(`${page}.tpl.html`, 'utf8')
    .replace('<!--HEADER-->', header)
    .replace('<!--FOOTER-->', footer);
  fs.writeFileSync(`${page}.html`, t);
  console.log(`built ${page}.html`);
}
