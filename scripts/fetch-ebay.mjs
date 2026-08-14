// fetch-ebay.mjs (SEO + Pinterest + Google feed)
import { readFile, writeFile, mkdir } from "node:fs/promises";

const CLIENT_ID     = process.env.EBAY_CLIENT_ID;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const MAX_ITEMS     = 500;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("EBAY_CLIENT_ID / EBAY_CLIENT_SECRET missing");
  process.exit(1);
}

const cfg = JSON.parse(await readFile(new URL("../config.json", import.meta.url), "utf8"));
const seller      = cfg.sellerUsername;
const marketplace = cfg.marketplaceId || "EBAY_US";
const brand       = cfg.brandName || "My eBay Store";
const storeUrl    = cfg.ebayStoreUrl || "";
if (!seller || seller === "YOUR_EBAY_USERNAME") {
  console.error("Set sellerUsername in config.json");
  process.exit(1);
}

const repoEnv = process.env.GITHUB_REPOSITORY || "sanukitrading2026-hub/ebay-store";
const [owner, repo] = repoEnv.split("/");
const SITE_BASE = `https://${owner}.github.io/${repo}`;

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g,
  c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

async function getToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: { "Authorization": `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!res.ok) throw new Error(`Token error ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function getSellerItems(token) {
  const headers = {
    "Authorization": `Bearer ${token}`,
    "X-EBAY-C-MARKETPLACE-ID": marketplace,
    "Content-Type": "application/json",
  };
  const all = [], seen = new Set();
  const LIMIT = 200;
  for (let offset = 0; offset <= 9800; offset += LIMIT) {
    const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    url.searchParams.set("filter", `sellers:{${seller}}`);
    url.searchParams.set("category_ids", "0");
    url.searchParams.set("limit", String(LIMIT));
    url.searchParams.set("offset", String(offset));
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (offset === 0) throw new Error(`Browse error ${res.status}: ${await res.text()}`);
      break;
    }
    const json  = await res.json();
    const batch = json.itemSummaries || [];
    for (const it of batch) {
      if (it.itemId && !seen.has(it.itemId)) { seen.add(it.itemId); all.push(it); }
    }
    const total = json.total || 0;
    console.log(`page offset=${offset}: got ${batch.length}, total=${total}, collected=${all.length}`);
    if (batch.length < LIMIT || all.length >= total || all.length >= MAX_ITEMS) break;
  }
  return all;
}

async function loadPreviousIds() {
  try {
    const prev = JSON.parse(await readFile(new URL("../data.json", import.meta.url), "utf8"));
    return new Set((prev.items || []).map(i => i.itemId).filter(Boolean));
  } catch { return new Set(); }
}

function priceStr(p) {
  if (!p) return "";
  const sym = { USD:"$", EUR:"€", GBP:"£", JPY:"¥", AUD:"A$", CAD:"C$" }[p.currency] || (p.currency + " ");
  return `${sym}${p.value}`;
}
const slugify = id => String(id || "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";

function itemPage(it) {
  const slug  = slugify(it.itemId);
  const url   = `${SITE_BASE}/items/${slug}.html`;
  const title = `${it.title} | ${brand}`;
  const desc  = `${it.title} — ${it.price}. Authentic Japanese item shipped worldwide with tracking. Buy now on eBay from ${brand}.`;
  const jsonld = {
    "@context": "https://schema.org", "@type": "Product",
    name: it.title, image: it.image || undefined, description: desc,
    offers: { "@type": "Offer", priceCurrency: it.priceCurrency || "USD",
      price: it.priceValue || undefined, availability: "https://schema.org/InStock",
      url: it.url || storeUrl },
  };
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product"><meta property="og:title" content="${esc(it.title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">
${it.image ? `<meta property="og:image" content="${esc(it.image)}">` : ""}
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>
  body{margin:0;font-family:-apple-system,"Hiragino Kaku Gothic ProN",system-ui,sans-serif;background:#0b0e14;color:#eef1f6;line-height:1.6}
  a{color:#60a5fa;text-decoration:none}
  .wrap{max-width:760px;margin:0 auto;padding:24px 20px 60px}
  .top{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;margin-bottom:24px}
  .logo{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#3b82f6,#f43f5e);display:grid;place-items:center;font-size:17px}
  .thumb{width:100%;max-width:520px;aspect-ratio:1/1;object-fit:cover;border-radius:16px;border:1px solid #28303f;background:#141924;display:block;margin:0 auto 22px}
  h1{font-size:22px;line-height:1.35;margin:0 0 12px}
  .price{font-size:28px;font-weight:800;color:#f5b301;margin:0 0 20px}
  .btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5b301,#f97316);color:#111;font-weight:800;padding:15px 28px;border-radius:999px;font-size:17px}
  .btn.blue{background:#3b82f6;color:#fff;font-weight:700}
  .meta{color:#9aa6b8;font-size:14px;margin-top:18px}
  .foot{margin-top:34px;border-top:1px solid #28303f;padding-top:16px;color:#9aa6b8;font-size:12.5px}
</style></head>
<body><div class="wrap">
  <a class="top" href="${esc(SITE_BASE)}/"><span class="logo">🎴</span>${esc(brand)}</a>
  ${it.image ? `<img class="thumb" src="${esc(it.image)}" alt="${esc(it.title)}">` : ""}
  <h1>${esc(it.title)}</h1>
  <div class="price">${esc(it.price)}</div>
  <a class="btn" href="${esc(it.url || storeUrl)}" target="_blank" rel="noopener">🛒 Buy now on eBay</a>
  <p class="meta">Authentic Japanese item · shipped worldwide with tracking · eBay Money Back Guarantee. Sold by ${esc(brand)} on eBay.</p>
  <p style="margin-top:20px"><a class="btn blue" href="${esc(storeUrl)}" target="_blank" rel="noopener">See all items in our store →</a></p>
  <div class="foot">© 2026 ${esc(brand)} · Independent seller on eBay. Not
