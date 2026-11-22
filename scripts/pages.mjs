// pages.mjs — 商品ページ・売り切れページ・サイトマップを作る（2026-11-23 集客と売上のための作り直し）
// fetch-ebay.mjs（毎朝の自動更新）と build-pages.mjs（data.json から作り直す）の両方から使う。
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";

export const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g,
  c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
export const slugify = id => String(id || "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
// eBay の画像を大きいサイズにする（共有したときの画像・Pinterest 用）
export const big = (u, size = 1600) => String(u || "").replace(/\/s-l\d+(\.(jpg|jpeg|png|webp))/i, `/s-l${size}$1`);
const idNum = id => (String(id || "").split("|")[1] || "");

const FDBK = "https://www.ebay.com/fdbk/feedback_profile/sanuki.japan?filter=feedback_page%3ARECEIVED_AS_SELLER";
const STOP = new Set("japanese japan new sealed card cards pokemon one piece figure the and of with set box game ver version from prize ichiban kuji banpresto bandai".split(" "));
const words = t => String(t || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(w => w.length > 2);

// 似た商品：タイトルの言葉が多く重なる順（同じ物は除く）
export function related(title, all, selfId, n = 4) {
  const mine = new Set(words(title).filter(w => !STOP.has(w)));
  const fam = /pokemon/i.test(title) ? "pokemon" : /one piece/i.test(title) ? "one piece" : /dragon ball/i.test(title) ? "dragon ball" : "";
  return all.filter(it => it.itemId && it.itemId !== selfId && it.url && it.image)
    .map(it => {
      let s = 0; for (const w of words(it.title)) if (mine.has(w)) s += 2;
      if (fam && it.title.toLowerCase().includes(fam)) s += 1;
      return { it, s };
    })
    .sort((a, b) => b.s - a.s || (Date.parse(b.it.listedAt || "") || 0) - (Date.parse(a.it.listedAt || "") || 0))
    .slice(0, n).map(x => x.it);
}

function relatedHtml(list, SITE_BASE, from) {
  if (!list.length) return "";
  return `<h2>More from our store</h2><div class="rel">` + list.map(r =>
    `<a href="${esc(SITE_BASE)}/items/${slugify(r.itemId)}.html" data-goatcounter-click="rel-${esc(from)}-${esc(idNum(r.itemId))}">` +
    `<img src="${esc(big(r.image, 500))}" alt="${esc(r.title)}" loading="lazy"><span class="n">${esc(r.title)}</span><span class="p">${esc(r.price)}</span></a>`).join("") + `</div>`;
}

function shareHtml(url, text, id, img = "") {
  const u = encodeURIComponent(url), t = encodeURIComponent(text);
  return `<div class="share"><span>Share:</span>` +
    `<a href="https://twitter.com/intent/tweet?url=${u}&text=${t}" target="_blank" rel="noopener" data-goatcounter-click="share-x-${id}">X</a>` +
    `<a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" data-goatcounter-click="share-fb-${id}">Facebook</a>` +
    `<a href="https://social-plugins.line.me/lineit/share?url=${u}" target="_blank" rel="noopener" data-goatcounter-click="share-line-${id}">LINE</a>` +
    `<button type="button" onclick="(navigator.clipboard?navigator.clipboard.writeText(location.href):Promise.reject()).then(()=>{this.textContent='Copied'},()=>prompt('URL',location.href))" data-goatcounter-click="share-copy-${id}">Copy link</button>` +
    `</div>`;
}

const STYLE = `<style>
  body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#0b0e14;color:#eef1f6;line-height:1.6}
  a{color:#60a5fa;text-decoration:none}
  .wrap{max-width:760px;margin:0 auto;padding:24px max(16px,env(safe-area-inset-right)) 60px max(16px,env(safe-area-inset-left))}
  .top{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;margin-bottom:24px;color:#eef1f6}
  .logo{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#3b82f6,#f43f5e)}
  .gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin:0 0 22px}
  .gal img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px;border:1px solid #28303f;background:#141924}
  .gal img:first-child{grid-column:1/-1;aspect-ratio:auto;max-height:520px;object-fit:contain}
  h1{font-size:22px;line-height:1.35;margin:0 0 12px}
  h2{font-size:18px;margin:34px 0 12px}
  .price{font-size:28px;font-weight:800;color:#f5b301;margin:0 0 14px}
  .btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5b301,#f97316);color:#111;font-weight:800;padding:15px 28px;border-radius:999px;font-size:17px}
  .btn.blue{background:#3b82f6;color:#fff;font-weight:700}
  .perks{list-style:none;padding:0;margin:16px 0;display:grid;gap:6px;font-size:14.5px;color:#cfd6e2}
  .perks li::before{content:"✓ ";color:#34d399;font-weight:800}
  .meta{color:#9aa6b8;font-size:14px;margin-top:18px}
  .share{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:20px 0;font-size:13px;color:#9aa6b8}
  .share a,.share button{font:inherit;font-weight:700;padding:7px 12px;border-radius:999px;border:1px solid #28303f;background:#141924;color:#eef1f6;cursor:pointer}
  .rel{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  @media(min-width:640px){.rel{grid-template-columns:repeat(4,minmax(0,1fr))}}
  .rel a{display:flex;flex-direction:column;gap:6px;background:#141924;border:1px solid #28303f;border-radius:12px;padding:8px;color:#eef1f6;min-width:0}
  .rel img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px}
  .rel .n{font-size:12.5px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .rel .p{font-weight:800;color:#f5b301;font-size:14px}
  .sold{background:#2a1a1a;border:1px solid #5b2a2a;border-radius:12px;padding:14px 16px;margin:0 0 18px;font-weight:700}
  .foot{margin-top:34px;border-top:1px solid #28303f;padding-top:16px;color:#9aa6b8;font-size:12.5px}
</style><script data-goatcounter="https://sanukitrading.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`;

const PERKS = `<ul class="perks">
    <li>Ships from Japan with tracking</li>
    <li>US buyers: import fees included at checkout</li>
    <li>30-day returns · eBay Money Back Guarantee</li>
    <li><a href="${FDBK}" target="_blank" rel="noopener" data-goatcounter-click="fdbk-item">100% positive feedback · Top Rated Seller on eBay</a></li>
  </ul>`;

export function itemPage(it, all, { SITE_BASE, brand, storeUrl }) {
  const slug = slugify(it.itemId), id = idNum(it.itemId);
  const url = `${SITE_BASE}/items/${slug}.html`;
  const title = `${it.title} | ${brand}`;
  const desc = `${it.title} — ${it.price}. Authentic Japanese item shipped worldwide with tracking. Buy now on eBay from ${brand}.`;
  const imgs = (it.images && it.images.length ? it.images : (it.image ? [it.image] : [])).map(u => big(u, 1600));
  const ogImg = imgs[0] || "";
  const buy = it.url || storeUrl;
  const jsonld = {
    "@context": "https://schema.org", "@type": "Product",
    name: it.title, image: imgs.length ? imgs : undefined, description: desc,
    brand: { "@type": "Brand", name: brand },
    offers: { "@type": "Offer", priceCurrency: it.priceCurrency || "USD",
      price: it.priceValue || undefined, availability: "https://schema.org/InStock",
      itemCondition: /new/i.test(it.condition || "new") ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      url: buy, seller: { "@type": "Organization", name: brand } },
  };
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product"><meta property="og:site_name" content="${esc(brand)}"><meta property="og:title" content="${esc(it.title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">
${ogImg ? `<meta property="og:image" content="${esc(ogImg)}"><meta name="twitter:image" content="${esc(ogImg)}">` : ""}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(it.title)}"><meta name="twitter:description" content="${esc(desc)}">
<meta property="product:price:amount" content="${esc(it.priceValue)}"><meta property="product:price:currency" content="${esc(it.priceCurrency || "USD")}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
${STYLE}</head>
<body><div class="wrap">
  <a class="top" href="${esc(SITE_BASE)}/"><span class="logo"></span>${esc(brand)}</a>
  <h1>${esc(it.title)}</h1>
  <div class="price">${esc(it.price)}</div>
  <a class="btn" href="${esc(buy)}" target="_blank" rel="noopener" data-goatcounter-click="ebay-buy-top-${esc(id)}" data-goatcounter-title="Buy on eBay (top)">Buy now on eBay</a>
  ${PERKS}
  ${imgs.length ? `<div class="gal">${imgs.map((u, i) => `<img src="${esc(u)}" alt="${esc(it.title)}${i ? " photo " + (i + 1) : ""}"${i ? ' loading="lazy"' : ""}>`).join("")}</div>` : ""}
  <a class="btn" href="${esc(buy)}" target="_blank" rel="noopener" data-goatcounter-click="ebay-buy-bottom-${esc(id)}" data-goatcounter-title="Buy on eBay (bottom)">Buy now on eBay</a>
  ${shareHtml(url, it.title + " — " + it.price + " from Japan", id, ogImg)}
  ${relatedHtml(related(it.title, all, it.itemId), SITE_BASE, id)}
  <p style="margin-top:24px"><a class="btn blue" href="${esc(storeUrl)}" target="_blank" rel="noopener" data-goatcounter-click="ebay-store" data-goatcounter-title="eBay store">See all items in our store</a></p>
  <div class="foot">© 2026 ${esc(brand)} · Independent seller on eBay. Not affiliated with or endorsed by eBay Inc.</div>
</div></body></html>`;
}

// 売れた・終わった商品のページ：消さずに「売り切れ・似た商品」にして今の出品へつなぐ
export function soldPage(old, all, { SITE_BASE, brand, storeUrl }) {
  const url = `${SITE_BASE}/items/${old.slug}.html`;
  const kw = words(old.title).filter(w => !STOP.has(w)).slice(0, 4).join(" ") || old.title;
  const search = `https://www.ebay.com/sch/i.html?_ssn=sanuki.japan&_nkw=${encodeURIComponent(kw)}`;
  const jsonld = { "@context": "https://schema.org", "@type": "Product", name: old.title, image: old.image || undefined,
    offers: { "@type": "Offer", availability: "https://schema.org/OutOfStock", priceCurrency: "USD", price: old.priceValue || undefined, url: storeUrl } };
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(old.title)} (listing ended) | ${esc(brand)}</title>
<meta name="description" content="${esc(old.title)} — this listing has ended. See the same or similar authentic Japanese items from ${esc(brand)}, shipped worldwide with tracking.">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product"><meta property="og:title" content="${esc(old.title)} — see similar items"><meta property="og:url" content="${esc(url)}">
${old.image ? `<meta property="og:image" content="${esc(big(old.image))}">` : ""}<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<!-- sold-page -->
${STYLE}</head>
<body><div class="wrap">
  <a class="top" href="${esc(SITE_BASE)}/"><span class="logo"></span>${esc(brand)}</a>
  <div class="sold">This listing has ended. It may be listed again — see the same or similar items from our store below.</div>
  <h1>${esc(old.title)}</h1>
  <a class="btn" href="${esc(search)}" target="_blank" rel="noopener" data-goatcounter-click="sold-search-${esc(old.slug)}">Find similar on eBay</a>
  ${PERKS}
  ${relatedHtml(related(old.title, all, "", 8), SITE_BASE, "sold")}
  <p style="margin-top:24px"><a class="btn blue" href="${esc(storeUrl)}" target="_blank" rel="noopener" data-goatcounter-click="ebay-store-sold">See all items in our store</a></p>
  <div class="foot">© 2026 ${esc(brand)} · Independent seller on eBay. Not affiliated with or endorsed by eBay Inc.</div>
</div></body></html>`;
}

const pick = (html, re) => { const m = html.match(re); return m ? m[1] : ""; };
const unesc = s => String(s || "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

export async function buildPages(items, ctx, rootUrl) {
  const dir = new URL("../items/", rootUrl);
  await mkdir(dir, { recursive: true });
  const pageUrls = [], live = new Set();
  for (const it of items) {
    if (!it.itemId) continue;
    const slug = slugify(it.itemId); live.add(slug + ".html");
    await writeFile(new URL(`${slug}.html`, dir), itemPage(it, items, ctx), "utf8");
    pageUrls.push(`${ctx.SITE_BASE}/items/${slug}.html`);
  }
  let sold = 0;
  for (const f of await readdir(dir)) {
    if (!f.endsWith(".html") || live.has(f)) continue;
    const html = await readFile(new URL(f, dir), "utf8");
    const title = unesc(pick(html, /<h1>([\s\S]*?)<\/h1>/));
    if (!title) continue;
    const image = unesc(pick(html, /<meta property="og:image" content="([^"]+)"/));
    const priceValue = pick(html, /"price":"?([0-9.]+)/);
    await writeFile(new URL(f, dir), soldPage({ slug: f.replace(/\.html$/, ""), title, image, priceValue }, items, ctx), "utf8");
    sold++;
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [`${ctx.SITE_BASE}/`, `${ctx.SITE_BASE}/games/`, `${ctx.SITE_BASE}/yoimiya/`, `${ctx.SITE_BASE}/kokonotsume/`, ...pageUrls]
      .map(u => `<url><loc>${u}</loc></url>`).join("\n") + `\n</urlset>\n`;
  await writeFile(new URL("../sitemap.xml", rootUrl), sitemap, "utf8");
  return { live: pageUrls.length, sold };
}
