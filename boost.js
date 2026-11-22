/* boost.js — 2026-11-23 社長「すべて集客、売り上げに直結できるのであればやろう」
   トップページの集客・売上の改善（ja.js の後に読む）
   1. 外へのクリックを全部数える（eBay・BOOTH・itch・note・SNS）
   2. 訪問者数の表示を外す
   3. スマホで商品を2列、オークション・新着・おすすめを最初の画面のすぐ下へ
   4. 商品カードに「追跡つき・米国は関税込み」
   5. 本物の eBay 評価（数字と3件）・eBay フォローの案内
   6. 共有ボタン（X・Facebook・LINE・リンクのコピー・スマホの共有） */
(function () {
  "use strict";
  var d = document;
  function el(html) { var t = d.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function bi(en, ja) { return '<span class="st-en">' + en + '</span><span class="st-ja">' + ja + "</span>"; }

  /* ---------- 1. クリックを数える ---------- */
  function kind(h) {
    if (/ebay\./i.test(h)) return "ebay";
    if (/booth\.pm/i.test(h)) return "booth";
    if (/itch\.io/i.test(h)) return "itch";
    if (/note\.com/i.test(h)) return "note";
    if (/(instagram|tiktok|x\.com|twitter|facebook|youtube|pinterest|line\.me)/i.test(h)) return "sns";
    return "";
  }
  function sectionOf(a) {
    var s = a.closest("section,header,nav,footer,#gameNotice");
    return s ? (s.id || s.tagName.toLowerCase()) : "page";
  }
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.hasAttribute("data-goatcounter-click")) return;
    var h = a.getAttribute("href") || "";
    var k = kind(h);
    if (!k) return;
    var m = h.match(/\/itm\/(\d{9,})/);
    var name = "out-" + k + "-" + sectionOf(a) + (m ? "-" + m[1] : "");
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: (a.textContent || "").trim().slice(0, 80), event: true }); } catch (_) {}
  }, true);

  /* ---------- 2〜6. 見た目 ---------- */
  var css = [
    "#visits{display:none!important}",
    "@media(max-width:640px){.items{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.item .body{padding:10px!important}.item .name{font-size:12.5px!important}.item .price{font-size:15px!important}.item .view{font-size:12px!important}.bst-perk{font-size:10.5px!important}section{padding:38px 0!important}.trust,.cats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.tcard,.cat{padding:14px!important}.tcard p,.cat p{font-size:12.5px!important}}",
    ".bst-perk{font-size:11.5px;color:var(--muted);line-height:1.4}",
    ".bst-proof{display:grid;gap:14px}",
    ".bst-nums{display:flex;flex-wrap:wrap;gap:10px 26px;font-size:14px;color:var(--muted)}",
    ".bst-nums b{font-size:24px;color:var(--ink);margin-right:5px;font-variant-numeric:tabular-nums}",
    ".bst-revs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}",
    "@media(max-width:760px){.bst-revs{grid-template-columns:1fr}}",
    ".bst-rev{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:8px;min-width:0}",
    ".bst-rev q{font-size:15px;line-height:1.55;quotes:'\\201C''\\201D'}",
    ".bst-rev small{color:var(--muted);font-size:12.5px}",
    ".bst-stars{color:var(--gold);letter-spacing:2px;font-size:14px}",
    ".bst-follow{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:18px}",
    ".bst-follow p{margin:0;color:var(--muted);font-size:14px;flex:1 1 260px}",
    ".bst-share{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:16px}",
    ".bst-share span.lbl{font-size:13px;color:var(--muted);margin-right:4px}",
    ".bst-share a,.bst-share button{font:inherit;font-size:13px;font-weight:700;padding:7px 12px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);cursor:pointer;text-decoration:none}",
    ".bst-share a:hover,.bst-share button:hover{border-color:var(--brand)}"
  ].join("");
  d.head.appendChild(el("<style>" + css + "</style>"));

  var STORE = "https://www.ebay.com/str/sanukitrading";
  var FDBK = "https://www.ebay.com/fdbk/feedback_profile/sanuki.japan?filter=feedback_page%3ARECEIVED_AS_SELLER";
  var SITE = "https://sanukitrading2026-hub.github.io/ebay-store/";

  function shareBar(url, text, where) {
    var u = encodeURIComponent(url), t = encodeURIComponent(text);
    var w = '<div class="bst-share" data-where="' + where + '"><span class="lbl">' + bi("Share:", "共有：") + "</span>" +
      '<a href="https://twitter.com/intent/tweet?url=' + u + "&text=" + t + '" target="_blank" rel="noopener" data-goatcounter-click="share-x-' + where + '">X</a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener" data-goatcounter-click="share-fb-' + where + '">Facebook</a>' +
      '<a href="https://social-plugins.line.me/lineit/share?url=' + u + '" target="_blank" rel="noopener" data-goatcounter-click="share-line-' + where + '">LINE</a>' +
      '<button type="button" class="bst-copy" data-goatcounter-click="share-copy-' + where + '">' + bi("Copy link", "リンクをコピー") + "</button>" +
      (navigator.share ? '<button type="button" class="bst-native" data-goatcounter-click="share-native-' + where + '">' + bi("More…", "その他…") + "</button>" : "") +
      "</div>";
    var node = el(w);
    node.querySelector(".bst-copy").addEventListener("click", function (ev) {
      var b = ev.currentTarget;
      function done() { b.innerHTML = bi("Copied", "コピーしました"); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("URL", url); });
      else prompt("URL", url);
    });
    var nb = node.querySelector(".bst-native");
    if (nb) nb.addEventListener("click", function () { navigator.share({ title: d.title, text: text, url: url }).catch(function () {}); });
    return node;
  }

  function perks() {
    d.querySelectorAll('.items a.item[href*="ebay."] .body').forEach(function (b) {
      if (b.querySelector(".bst-perk")) return;
      var v = b.querySelector(".view:last-child") || b.lastElementChild;
      var p = el('<div class="bst-perk">' + bi("Ships from Japan · tracked · US import fees included", "日本から追跡つき・米国は関税込み") + "</div>");
      b.insertBefore(p, v);
    });
  }

  function arrange() {
    var hero = d.getElementById("top");
    var auc = d.getElementById("auctions"), feat = d.getElementById("featured"), rec = d.getElementById("recommended");
    if (!hero || !feat) return;
    var after = hero;
    [auc, feat, rec].forEach(function (s) { if (s) { after.after(s); after = s; } });
  }

  function proof() {
    if (d.getElementById("bst-proof")) return;
    var sec = el('<section id="bst-proof"><div class="wrap bst-proof">' +
      '<p class="eyebrow">' + bi("From real buyers", "買った方の声") + "</p>" +
      '<h2 class="title">' + bi("Trusted by collectors worldwide", "世界のコレクターに選ばれています") + "</h2>" +
      '<div class="bst-nums"><span><b>100%</b>' + bi("positive feedback (12 months)", "ポジティブ評価（過去12か月）") + "</span>" +
      "<span><b>122</b>" + bi("positive ratings in 12 months", "件の良い評価（過去12か月）") + "</span>" +
      "<span><b>Top Rated</b>" + bi("Seller on eBay", "eBayの最高評価出品者") + "</span></div>" +
      '<p class="updated">' + bi("As shown on our eBay feedback profile, November 23, 2026.", "eBayの評価ページの表示（2026年11月23日時点）") + "</p>" +
      '<div class="bst-revs">' +
      rev("Great communication and service. Cards came pristinely wrapped and shipped faster than expected.", "s***1 · United States · Mega Rayquaza ex SAR") +
      rev("An excellent seller! So pleased with the packaging and shipping! Thanks!", "y***4 · Pokemon 30th Promo Card Pack") +
      rev("Fantastic seller. Fast delivery and continued communication. Packaged well, as described.", "n***2 · Godzilla Minus One figure") +
      "</div>" +
      '<p><a class="btn" href="' + FDBK + '" target="_blank" rel="noopener">' + bi("Read all feedback on eBay →", "eBayの評価をすべて見る →") + "</a></p>" +
      '<div class="bst-follow"><p>' + bi("Follow our eBay store to get new arrivals and our newsletter with follower-only coupons when we run them.", "eBayのお店をフォローすると、新着とお知らせ（フォロワー限定クーポンを出すときはその案内も）が届きます。") + "</p>" +
      '<a class="btn gold" href="' + STORE + '" target="_blank" rel="noopener">' + bi("Follow on eBay", "eBayでフォローする") + "</a></div>" +
      "</div></section>");
    var anchor = d.getElementById("divisions") || d.getElementById("why");
    if (anchor) anchor.before(sec); else d.body.appendChild(sec);
  }
  function rev(q, who) {
    return '<div class="bst-rev"><span class="bst-stars" aria-label="Positive">★★★★★</span><q>' + q + "</q><small>" + who + " · " + bi("verified eBay purchase", "eBayで購入した方") + "</small></div>";
  }

  function shares() {
    var heroBtns = d.querySelector("#top .cta, #top .hero-cta, #top .btns") || d.querySelector("#top .wrap") || d.getElementById("top");
    if (heroBtns && !d.querySelector('.bst-share[data-where="hero"]')) heroBtns.after(shareBar(SITE, "Authentic Japanese Pokemon & One Piece cards and figures, shipped from Japan — Sanuki Trading", "hero"));
    var band = d.getElementById("socialRow");
    if (band && !d.querySelector('.bst-share[data-where="band"]')) { var s = shareBar(SITE, "Sanuki Trading — Japanese cards, figures and horror games", "band"); s.style.justifyContent = "center"; band.after(s); }
  }

  function run() { try { arrange(); proof(); shares(); perks(); } catch (e) { console.warn("boost", e); } }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", run); else run();
  new MutationObserver(function () { perks(); }).observe(d.body, { childList: true, subtree: true });
})();
