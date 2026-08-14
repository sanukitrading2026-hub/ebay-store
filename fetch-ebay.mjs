// ============================================================================
//  fetch-ebay.mjs
//  あなたのeBayストアの出品を eBay公式Browse API で取得し、data.json を更新します。
//  GitHub Actions が毎日自動で実行します(手動実行も可)。
//  認証キーは環境変数(GitHub Secrets)から読み込むので、コードには書きません。
// ============================================================================
import { readFile, writeFile } from "node:fs/promises";

const CLIENT_ID     = process.env.EBAY_CLIENT_ID;      // GitHub Secrets から
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;  // GitHub Secrets から
const MAX_ITEMS     = 24;                               // サイトに載せる最大件数

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ EBAY_CLIENT_ID / EBAY_CLIENT_SECRET が設定されていません(GitHub Secrets を確認)。");
  process.exit(1);
}

// --- 設定を読み込む ---
const cfg = JSON.parse(await readFile(new URL("../config.json", import.meta.url), "utf8"));
const seller      = cfg.sellerUsername;
const marketplace = cfg.marketplaceId || "EBAY_US";
if (!seller || seller === "YOUR_EBAY_USERNAME") {
  console.error("❌ config.json の sellerUsername をあなたのeBayユーザー名に変更してください。");
  process.exit(1);
}

// --- 1) アプリ用アクセストークンを取得(client_credentials) ---
async function getToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=" +
          encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!res.ok) throw new Error(`Token error ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

// --- 2) セラーの出品を取得(filter=sellers + category_ids=0) ---
async function getSellerItems(token) {
  const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("filter", `sellers:{${seller}}`);
  url.searchParams.set("category_ids", "0");
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort", "newlyListed");
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Browse error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.itemSummaries || [];
}

// --- 3) 既存 data.json を読み、"NEW" 判定用に前回のIDを覚えておく ---
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

// --- メイン ---
try {
  const token   = await getToken();
  const summaries = await getSellerItems(token);
  const prevIds = await loadPreviousIds();

  const items = summaries.slice(0, MAX_ITEMS).map(it => ({
    itemId: it.itemId,
    title:  it.title,
    price:  priceStr(it.price),
    image:  it.image?.imageUrl || it.thumbnailImages?.[0]?.imageUrl || "",
    url:    it.itemAffiliateWebUrl || it.itemWebUrl || "",
    isNew:  it.itemId ? !prevIds.has(it.itemId) : false,
  }));

  const out = { updatedAt: new Date().toISOString(), seller, count: items.length, items };
  await writeFile(new URL("../data.json", import.meta.url), JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`✅ ${items.length} 件を取得して data.json を更新しました(新着 ${items.filter(i=>i.isNew).length} 件)。`);
} catch (err) {
  console.error("❌ 取得に失敗しました:", err.message);
  process.exit(1);
}
