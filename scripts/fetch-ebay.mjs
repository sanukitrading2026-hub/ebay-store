// fetch-ebay.mjs (SEO + Pinterest + Google feed + angle images)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { buildPages, big } from "./pages.mjs";

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
    url.searchParams.set("filter", `sellers:{${seller}},buyingOptions:{FIXED_PRICE|AUCTION|BEST_OFFER}`);
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
    console.log(`offset=${offset}: got ${batch.length}, total=${total}, collected=${all.length}`);
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

async function loadPreviousImages() {
  const m = new Map();
  try {
    const prev = JSON.parse(await readFile(new URL("../data.json", import.meta.url), "utf8"));
    for (const i of (prev.items || [])) {
      if (i.itemId && Array.isArray(i.images) && i.images.length) m.set(i.itemId, i.images);
    }
  } catch {}
  return m;
}

async function getImages(token, itemId) {
  try {
    const url = "https://api.ebay.com/buy/browse/v1/item/" + encodeURIComponent(itemId);
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": marketplace,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return [];
    const j = await res.json();
    const arr = [];
    if (j.image?.imageUrl) arr.push(j.image.imageUrl);
    for (const a of (j.additionalImages || [])) if (a.imageUrl) arr.push(a.imageUrl);
    return arr.slice(0, 6);
  } catch { return []; }
}

function priceStr(p) {
  if (!p) return "";
  const sym = { USD:"$", EUR:"EUR ", GBP:"GBP ", JPY:"JPY ", AUD:"A$", CAD:"C$" }[p.currency] || (p.currency + " ");
  return `${sym}${p.value}`;
}
const slugify = id => String(id || "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";

// 商品ページ・売り切れページ・サイトマップは pages.mjs（2026-11-23）

try {
  const token     = await getToken();
  const summaries = await getSellerItems(token);
  const prevIds   = await loadPreviousIds();

  const items = summaries.slice(0, MAX_ITEMS).map(it => ({
    itemId: it.itemId,
    title:  it.title,
    price:  priceStr(it.price),
    priceValue:    it.price?.value || "",
    priceCurrency: it.price?.currency || "USD",
    image:  it.image?.imageUrl || it.thumbnailImages?.[0]?.imageUrl || "",
    url:    it.itemAffiliateWebUrl || it.itemWebUrl || "",
    condition: it.condition || "",
    isNew:  it.itemId ? !prevIds.has(it.itemId) : false,
    listedAt: it.itemCreationDate || "",
    buyingOptions: it.buyingOptions || [],
    currentBid: priceStr(it.currentBidPrice),
    bidCount: (it.bidCount ?? null),
    endAt: it.itemEndDate || "",
  }));

  const prevImg = await loadPreviousImages();
  for (const it of items) {
    let imgs = it.itemId ? prevImg.get(it.itemId) : null;
    if (!imgs) imgs = it.itemId ? await getImages(token, it.itemId) : [];
    if ((!imgs || !imgs.length) && it.image) imgs = [it.image];
    it.images = imgs;
  }

  const out = { updatedAt: new Date().toISOString(), seller, count: items.length, items };
  await writeFile(new URL("../data.json", import.meta.url), JSON.stringify(out, null, 2) + "\n", "utf8");

  const built = await buildPages(items, { SITE_BASE, brand, storeUrl }, import.meta.url);
  console.log(`pages: live ${built.live}, sold ${built.sold}`);
  await writeFile(new URL("../robots.txt", import.meta.url),
    `User-agent: *\nAllow: /\nSitemap: ${SITE_BASE}/sitemap.xml\n`, "utf8");

  const csvEsc = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const cond   = c => /new/i.test(c || "") ? "new" : (c ? "used" : "new");
  const header = ["id","title","description","link","image_link","price","availability","condition","brand"];
  const rows   = [header.join(",")];
  for (const it of items) {
    if (!it.itemId || !it.url || !it.image || !it.priceValue) continue;
    const desc = `${it.title} — authentic Japanese item, shipped worldwide with tracking from ${brand}.`;
    rows.push([
      csvEsc(it.itemId), csvEsc(it.title.slice(0, 100)), csvEsc(desc.slice(0, 500)),
      csvEsc(`${SITE_BASE}/items/${slugify(it.itemId)}.html`), csvEsc(big(it.image)),
      csvEsc(`${it.priceValue} ${it.priceCurrency}`), csvEsc("in stock"),
      csvEsc(cond(it.condition)), csvEsc(brand),
    ].join(","));
  }
  await writeFile(new URL("../feed.csv", import.meta.url), rows.join("\n") + "\n", "utf8");

  const gtype = t => /pokemon|card|tcg|booster|psa/i.test(t) ? "Trading Cards"
    : /figure|nendoroid|banpresto|megahouse|figuarts|prize/i.test(t) ? "Anime Figures"
    : "Japanese Collectibles";
  const gHeader = ["id","title","description","link","image_link","price","availability","condition","brand","identifier_exists","product_type"];
  const gRows = [gHeader.join(",")];
  for (const it of items) {
    if (!it.itemId || !it.url || !it.image || !it.priceValue) continue;
    const gdesc = `${it.title} — authentic Japanese item, shipped worldwide with tracking from ${brand}.`;
    gRows.push([
      csvEsc(it.itemId), csvEsc(it.title.slice(0, 150)), csvEsc(gdesc.slice(0, 500)),
      csvEsc(`${SITE_BASE}/items/${slugify(it.itemId)}.html`), csvEsc(big(it.image)),
      csvEsc(`${it.priceValue} ${it.priceCurrency}`), csvEsc("in stock"),
      csvEsc(cond(it.condition)), csvEsc(brand), csvEsc("no"), csvEsc(gtype(it.title)),
    ].join(","));
  }
  await writeFile(new URL("../feed-google.csv", import.meta.url), gRows.join("\n") + "\n", "utf8");

  console.log(`OK ${items.length} items with images, pages + feeds built.`);
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
}
