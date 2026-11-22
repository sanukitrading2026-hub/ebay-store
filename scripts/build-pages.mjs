// build-pages.mjs — data.json から商品ページ・売り切れページ・サイトマップを作り直す（API を使わない）
import { readFile } from "node:fs/promises";
import { buildPages } from "./pages.mjs";
const cfg = JSON.parse(await readFile(new URL("../config.json", import.meta.url), "utf8"));
const data = JSON.parse(await readFile(new URL("../data.json", import.meta.url), "utf8"));
const SITE_BASE = "https://sanukitrading2026-hub.github.io/ebay-store";
const r = await buildPages(data.items || [], { SITE_BASE, brand: cfg.brandName || "Sanuki Trading", storeUrl: cfg.ebayStoreUrl || "" }, import.meta.url);
console.log(r);
