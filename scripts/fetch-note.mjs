// fetch-note.mjs — noteの最新記事5本を notes.json に書く（ホームページの「noteの新しい記事」欄で使う）
// 記事名・価格はnoteのデータそのまま。読むだけで、noteには何も書き込まない。
import { readFile, writeFile } from "node:fs/promises";

const API = "https://note.com/api/v2/creators/sanukitrading/contents?kind=note&page=1";
const OUT = new URL("../notes.json", import.meta.url);

const res = await fetch(API, { headers: { "User-Agent": "Mozilla/5.0 (sanukitrading homepage)", "Accept": "application/json" } });
if (!res.ok) { console.error("note API error", res.status); process.exit(1); }
const json = await res.json();
const contents = (json && json.data && json.data.contents) || [];

const toDate = iso => {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/); // publishAt は日本時間（+09:00）
  return m ? `${+m[1]}年${+m[2]}月${+m[3]}日` : "";
};
const list = contents
  .filter(c => c && c.name && /^https:\/\/note\.com\/sanukitrading\/n\/[a-z0-9]+$/.test(c.noteUrl || ""))
  .slice(0, 5)
  .map(c => ({ name: c.name, url: c.noteUrl, price: Number(c.price) || 0, date: toDate(c.publishAt) }));

if (!list.length) { console.error("no articles found; keep the old file"); process.exit(1); }

const text = JSON.stringify(list, null, 2) + "\n";
let old = "";
try { old = await readFile(OUT, "utf8"); } catch {}
if (old === text) { console.log("NOCHANGE"); process.exit(0); }
await writeFile(OUT, text, "utf8");
console.log("CHANGED", list.length);
