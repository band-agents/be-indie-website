# BE-INDIE website concept

A commerce-first redesign of [be-indie.com](https://be-indie.com), modelled on the structure of labesny.com and built on Be-Indie's real catalogue (products, prices, sale prices, sizes, descriptions and photos).

Static HTML/CSS/JS, no build tooling beyond a tiny assemble script.

**Branding:** `brand.css` is the brand layer (electric blue `#1701FB`, Poppins, bold uppercase headlines, pill buttons, black + blue announcement bars, blue footer) and the real Be-Indie wordmark lives in `assets/`. It loads after each page's own styles, so changing the look means editing that one file.

## Pages

| Page | File | Notes |
| --- | --- | --- |
| Homepage | `index.html` (`store.html` is the editable source) | Announcement bars, two-tier header with mega-menus, hero, category rail, collab wordmark band, new in, shop by fit, best sellers, sale, under 1,500 EGP, menswear, trust strip, newsletter |
| Product page | `product.html?h=<handle>` | Gallery with zoom, colour siblings, live size availability, add to bag + mini cart, description / care / returns accordions, recommendations |
| Collection page | `collection.html?c=<new\|women\|men\|denim\|corsets\|sale\|all>` | Filters (category, size, colour, price, on sale), sorting, active chips, show more, filter state kept in the URL, mobile filter drawer |

## Run it

The pages load their data from `.js` files, so serve the folder over HTTP:

```bash
npx serve .
```

## Editing

`product.html` and `collection.html` are generated from `*.tpl.html`, with the header and footer injected from `store.html` so all three pages share them. After editing `store.html` or a template, run:

```bash
node build.js
```

`index.html` is a copy of `store.html` written by the same script.

## Data

`data.js` (homepage sections) and `catalog.js` (all products) are snapshots of Be-Indie's public Shopify endpoints. Refresh them with:

```bash
node tools/fetch-data.js
```

Needs Node 18+.

## Known gaps

- Product photos are hotlinked from Be-Indie's Shopify CDN; host your own copies before launch.
- Checkout, search, account, wishlist persistence, the Arabic version and the WhatsApp button are placeholders.
- Only facts found on the live site are used: the 5% credit card offer and the 14-day return policy (including in-store returns). Shipping terms were not found, so none are claimed.
- Colour swatches are approximated from the colour names in product titles.
