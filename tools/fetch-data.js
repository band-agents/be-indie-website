// Regenerates data.js (homepage) and catalog.js (product + collection pages) from
// be-indie.com's public Shopify endpoints. Usage: node tools/fetch-data.js [outDir]
// Needs Node 18+ (global fetch). Output defaults to the repo root.
const fs = require('fs');
const path = require('path');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const BASE = 'https://be-indie.com';
const get = async (url) => (await fetch(BASE + url, { headers: { 'user-agent': 'Mozilla/5.0' } })).json();

const modelFirst = (srcs) => {
  const a = [...srcs];
  const m = a.findIndex((u) => /ullbody/i.test(u));
  if (m > 0) a.unshift(a.splice(m, 1)[0]);
  return a;
};
const slim = (p) => {
  const v = p.variants[0];
  return {
    h: p.handle,
    t: p.title.trim().replace(/\s+/g, ' '),
    p: +v.price,
    c: v.compare_at_price && +v.compare_at_price > +v.price ? +v.compare_at_price : null,
    a: p.variants.some((x) => x.available),
    s: p.variants.filter((x) => x.available).map((x) => x.title),
    i: modelFirst(p.images.map((i) => i.src)).slice(0, 3),
  };
};
const text = (html) =>
  (html || '')
    .replace(/<\/(p|li|div|h\d)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&rsquo;/g, '’')
    .split('\n')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

(async () => {
  // ---- catalog.js: every product with full gallery, sizes and description ----
  const all = (await get('/products.json?limit=250')).products;
  const catalog = all
    .filter((p) => p.images.length && p.variants.length)
    .map((p) => {
      const v = p.variants[0];
      return {
        h: p.handle,
        t: p.title.trim().replace(/\s+/g, ' '),
        p: +v.price,
        c: v.compare_at_price && +v.compare_at_price > +v.price ? +v.compare_at_price : null,
        opt: (p.options[0] && p.options[0].name) || 'Size',
        v: p.variants.map((x) => [x.title, x.available ? 1 : 0]),
        sku: (v.sku || '').split('/')[0],
        d: text(p.body_html),
        i: modelFirst(p.images.map((i) => i.src)).slice(0, 10),
      };
    });
  fs.writeFileSync(path.join(out, 'catalog.js'), 'window.CAT=' + JSON.stringify(catalog) + ';');

  // ---- data.js: curated homepage sections ----
  const byHandle = Object.fromEntries(all.map((p) => [p.handle, slim(p)]));
  const col = async (c) => {
    try { return (await get(`/collections/${c}/products.json?limit=60`)).products.filter((p) => p.images.length >= 2).map(slim); }
    catch { return []; }
  };
  const names = ['new-arrivals', 'best-sellers', 'menswear', 'end-of-season-offers', 'jeans', 'corsets', 'shirts-1',
    'shorts-1', 'jackets-1', 'sets', 'skirts', 't-shirts', 'topsii', 'the-knit-shop', 'dresses', 'trousers'];
  const d = {};
  for (const n of names) d[n] = await col(n);
  const first = (c) => (d[c] || []).find((p) => p.a) || (d[c] || [])[0];
  const data = {};
  data.new = d['new-arrivals'].filter((p) => p.a).slice(0, 12);
  data.best = d['best-sellers'].filter((p) => p.a).slice(0, 10);
  data.men = d.menswear.filter((p) => p.a).slice(0, 10);
  data.sale = d['end-of-season-offers'].filter((p) => p.a && p.c)
    .sort((x, y) => (y.c - y.p) / y.c - (x.c - x.p) / x.c).slice(0, 10);
  const seen = new Set();
  const pool = [...d.jeans, ...d.topsii, ...d['shirts-1'], ...d['shorts-1'], ...d['t-shirts'], ...d['the-knit-shop'], ...d['best-sellers']];
  data.under = pool.filter((p) => p.a && p.p <= 1500 && !seen.has(p.h) && seen.add(p.h)).slice(0, 10);
  data.cats = [['Jeans', 'jeans'], ['Corsets', 'corsets'], ['Tops', 'topsii'], ['Shirts', 'shirts-1'], ['Knitwear', 'the-knit-shop'],
    ['Jackets', 'jackets-1'], ['Shorts', 'shorts-1'], ['Matching Sets', 'sets'], ['Dresses', 'dresses'], ['T-Shirts', 't-shirts'], ['Trousers', 'trousers']]
    .map(([n, c]) => { const p = first(c); return p ? { n, h: p.h, i: p.i[0] } : null; }).filter(Boolean);
  const j = data.cats.find((c) => c.n === 'Jeans');
  if (j && byHandle['square-pocket-jeans-la-blue']) j.i = byHandle['square-pocket-jeans-la-blue'].i[0];
  const pick = (h) => byHandle[h] && byHandle[h].i[0];
  data.hero = ['denim-jeans-with-crochet-cream', 'jacquard-blazer-midnight-blue', 'floral-wide-leg-midnight-blue'].map(pick);
  data.fits = [['Destiny', 'destiny-jeans-stone-blue'], ['Wide Leg', 'extra-wide-leg-jeans-la-blue'],
    ['Barrel', 'barrel-jeans-stone-ice-blue'], ['Baggy', 'baggy-jeans-medium-acid-blue']]
    .map(([n, h]) => ({ n, i: pick(h) })).filter((f) => f.i);
  fs.writeFileSync(path.join(out, 'data.js'), 'window.DATA=' + JSON.stringify(data) + ';');
  console.log(`catalog: ${catalog.length} products · new ${data.new.length}, sale ${data.sale.length}, under ${data.under.length}`);
})();
