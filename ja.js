/* ja.js — Sanuki Trading の追加分（日本語／英語の切り替え・8か国のeBay・note・SNS・LINE）
   index.html の </body> の直前に <script src="ja.js" defer></script> を1行足すと動く。
   商品一覧の自動更新（data.json）や Pinterest・Googleフィード・アクセス解析には触らない。 */
(function () {
  "use strict";

  /* noteの新しい記事（noteのデータそのまま。新しい順） */
  /*NOTE-LATEST:START*/
  var NOTES = [
    { name: "AIのうそ（ハルシネーション）を防ぐ依頼文｜「この店は本物を売っている」と言ってくれたバイヤーと、AIの「それらしい数字」【連載第6話】", url: "https://note.com/sanukitrading/n/n8c76dec5f5e9", price: 780, date: "2026年11月1日" },
    { name: "AIにPDCAを回してもらう依頼文・ひな形｜「伸びたら、まちがってないんだな」と思っていた私と、AIが書いた「まだ1日分」の1行【連載第5話】", url: "https://note.com/sanukitrading/n/n08b4fa0cc180", price: 780, date: "2026年10月31日" },
    { name: "AIの通知を「要対応」だけにする決まり｜「重要で俺がやらないといけない様な」ことだけ知らせて、と打ち込んだ日【連載第4話・依頼文つき】", url: "https://note.com/sanukitrading/n/n43c7f43a60e7", price: 780, date: "2026年10月30日" },
    { name: "「あなたの店から買わなくても、ほかで買える」と言われた日と、「友」と呼んでくれたバイヤー｜【連載 番外編2】自律神経失調症で仕事を辞めた私の、eBayのバイヤーとのやりとり", url: "https://note.com/sanukitrading/n/n09584f5e8a4a", price: 0, date: "2026年10月30日" },
    { name: "Claude定期タスク、最初の1本の選び方と作り方｜「クラウドコード」と呼んでいた私が、寝ている間にAIを動かすまで【連載第3話・指示文つき】", url: "https://note.com/sanukitrading/n/n13f45640ea34", price: 980, date: "2026年10月30日" }
  ];
  /*NOTE-LATEST:END*/

  var SITES = [
    ["https://www.ebay.com/str/sanukitrading", "United States", "アメリカ", "ebay.com · USD"],
    ["https://www.ebay.co.uk/str/sanukitrading", "United Kingdom", "イギリス", "ebay.co.uk · GBP"],
    ["https://www.ebay.de/str/sanukitrading", "Germany", "ドイツ", "ebay.de · EUR"],
    ["https://www.ebay.fr/str/sanukitrading", "France", "フランス", "ebay.fr · EUR"],
    ["https://www.ebay.it/str/sanukitrading", "Italy", "イタリア", "ebay.it · EUR"],
    ["https://www.ebay.es/str/sanukitrading", "Spain", "スペイン", "ebay.es · EUR"],
    ["https://www.ebay.com.au/str/sanukitrading", "Australia", "オーストラリア", "ebay.com.au · AUD"],
    ["https://www.ebay.ca/str/sanukitrading", "Canada", "カナダ", "ebay.ca · CAD"]
  ];

  var SNS = [
    ["Instagram", "https://www.instagram.com/sanuki.trading/"],
    ["TikTok", "https://www.tiktok.com/@sanukitrading"],
    ["X", "https://x.com/st21343919"],
    ["note", "https://note.com/sanukitrading"],
    ["LINE", "https://line.me/R/ti/p/@619sptqi"]
  ];

  /* 今のページの英語の文 → 日本語（見つかった文だけ置き換える。商品名は英語のまま） */
  var JA = {
    "Featured": "商品", "Categories": "カテゴリ", "Why us": "安心の理由", "About": "お店について",
    "Visit eBay Store →": "eBayのお店へ →",
    "Curated finds,": "日本で見つけた一品を、", "shipped worldwide": "世界中へ", "from Japan.": "お届けします。",
    "Japanese collectibles, fashion, cameras and more — authenticated, carefully packed, and delivered with tracking to your door.":
      "日本のコレクター向け商品を、本物だけ、ていねいに梱包して、追跡つきでお届けします。",
    "🛒 Shop on eBay": "🛒 eBayで買う", "See what's new": "新着を見る",
    "listings": "点 出品中", "Tracked": "追跡つき", "shipping": "発送", "Worldwide": "世界中へ", "delivery": "お届け",
    "30-day": "30日間", "returns": "返品",
    "Live from our store": "eBayのお店から", "New & featured items": "新着・おすすめ商品",
    "Updated automatically from our eBay store — tap any item to view and buy on eBay.":
      "eBayのお店から毎日自動で更新しています。商品を押すと、eBayのページで見て買えます。",
    "View all items on eBay →": "eBayですべての商品を見る →",
    "What we sell": "取り扱い", "Browse by category": "カテゴリから探す",
    "Every category links straight to our eBay store.": "どのカテゴリも、eBayのお店につながっています。",
    "Shop now →": "見る →",
    "Cameras & Photo": "カメラ・写真", "Vintage & modern gear": "ビンテージから最新まで",
    "Japanese Fashion": "日本のファッション", "Streetwear & vintage": "ストリート・古着",
    "Games & Toys": "ゲーム・おもちゃ", "Retro consoles & figures": "レトロゲーム機・フィギュア",
    "Watches": "腕時計", "Seiko, Citizen & more": "セイコー・シチズンなど",
    "Collectibles": "コレクション", "Cards, coins & rare items": "カード・コイン・レアもの",
    "Audio & Vinyl": "オーディオ・レコード", "Records & hi-fi": "レコード・音響機器",
    "Buy with confidence": "安心して買えるように", "Why shop with us": "このお店で買う理由",
    "Carefully packed": "ていねいな梱包",
    "Every order is wrapped to arrive safely, anywhere in the world.": "世界のどこへでも、無事に届くように包みます。",
    "Tracking on every order": "すべて追跡番号つき",
    "You always get a tracking number for peace of mind.": "追跡番号を必ずお知らせします。",
    "Friendly support": "ていねいな対応",
    "Questions? Message us any time through eBay — we reply fast.": "質問はeBayのメッセージでいつでもどうぞ。すぐにお返事します。",
    "eBay Money Back Guarantee": "eBayの返金保証",
    "Protected checkout and easy 30-day returns on eBay.": "eBayの安全な支払いと、30日間の返品。",
    "Our story": "お店の話", "About the store": "お店について",
    "We're a Japan-based seller passionate about sending quality items to buyers around the globe. Each order is checked, cleaned and packed with care. Every purchase goes through eBay's secure checkout — your payment and personal details stay protected by eBay and are never handled by us directly.":
      "日本から、世界中のお客さまへ良い品を届けているお店です。注文ごとに確認し、きれいにして、ていねいに梱包します。お支払いはすべてeBayの安全な決済で行われ、お支払い情報や個人情報はeBayが守ります。私たちが直接あつかうことはありません。",
    "Ready to find something great?": "欲しい一品を探しに行きませんか？",
    "Buyers worldwide shop our store on eBay. Come take a look.": "世界中のお客さまが、eBayのお店で買っています。ぜひ見てください。",
    "🛒 Visit our eBay Store": "🛒 eBayのお店を見る", "eBay Store": "eBayのお店",
    "© 2026 Sanuki Trading · Independent seller on eBay. Not affiliated with or endorsed by eBay Inc.":
      "© 2026 Sanuki Trading · eBayで販売している個人のお店です。eBay Inc.とは関係がなく、推薦も受けていません。"
  };

  var root = document.documentElement;
  function pickLang() {
    var h = (location.hash || "").replace("#", "");
    if (h === "ja" || h === "en") return h;
    return (navigator.language || "").toLowerCase().indexOf("ja") === 0 ? "ja" : "en";
  }
  var lang = pickLang();

  /* 見た目：店のロゴ（白地に、赤い日の丸と黒い富士山・波）に合わせる */
  var LOGO = "data:image/jpeg;base64,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";
  var SELLER_SEARCH = "https://www.ebay.com/sch/i.html?_ssn=sanuki.japan&_nkw=";
  var fonts = document.createElement("link");
  fonts.rel = "stylesheet";
  fonts.href = "https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&family=Noto+Sans+JP:wght@500;700;900&display=swap";
  document.head.appendChild(fonts);
  var fav = document.createElement("link"); fav.rel = "icon"; fav.type = "image/png"; fav.href = LOGO; document.head.appendChild(fav);
  var css = document.createElement("style");
  css.textContent =
    ":root{--bg:#ffffff;--panel:#ffffff;--panel2:#f5f4f1;--line:#e3e1dc;--ink:#141414;--muted:#5d6067;--brand:#e31e25;--accent:#e31e25;--gold:#141414;color-scheme:light}" +
    'body{font-family:Inter,"Noto Sans JP",-apple-system,"Hiragino Kaku Gothic ProN",system-ui,sans-serif;background:var(--bg);color:var(--ink)}' +
    "nav{background:rgba(255,255,255,.92);border-bottom:1px solid var(--line)}" +
    ".brand{font-weight:800;letter-spacing:-.2px}" +
    ".brand .logo{background:none!important;width:40px;height:40px;border-radius:50%;overflow:hidden}.brand .logo img{width:100%;height:100%;object-fit:cover;display:block}" +
    ".btn{background:var(--brand);color:#fff;box-shadow:0 8px 22px rgba(227,30,37,.25)}.btn:hover{box-shadow:0 12px 28px rgba(227,30,37,.38)}" +
    ".btn.gold{background:var(--brand);box-shadow:0 8px 22px rgba(227,30,37,.25)}" +
    ".btn.ghost{background:#fff;border:2px solid var(--ink);color:var(--ink)}" +
    ".hero{background:#fff;padding-bottom:110px}" +
    ".hero::before{background:var(--brand)!important;inset:auto!important;right:-120px!important;top:-140px!important;width:520px;height:520px;border-radius:50%;z-index:0!important}" +
    "@media (max-width:900px){.hero::before{width:220px;height:220px;right:-110px!important;top:-130px!important}}" +
    "#brandName{white-space:nowrap}" +
    "@media (max-width:520px){#navCta{padding:9px 14px;font-size:13px;white-space:nowrap}.brand{font-size:16px;gap:8px}.st-langs{margin-right:8px}.st-langs a{padding:5px 9px}#brandName{display:none}}" +
    ".hero::after{content:\"\";position:absolute;left:0;right:0;bottom:0;height:90px;pointer-events:none;" +
      "background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='90' viewBox='0 0 1200 90'%3E%3Cg fill='none' stroke='%23141414' stroke-width='6' stroke-linecap='round'%3E%3Cpath d='M0 30 Q300 0 600 30 T1200 30'/%3E%3Cpath d='M0 62 Q300 32 600 62 T1200 62'/%3E%3C/g%3E%3C/svg%3E\") center bottom/1200px 90px repeat-x}" +
    ".hero .wrap{position:relative;z-index:1}" +
    ".st-kicker{color:var(--brand);font-weight:800;font-size:13px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 14px}" +
    ".hero h1{font-weight:900;color:var(--ink);max-width:640px}.hero h1 .hl{background:none;-webkit-background-clip:initial;background-clip:initial;color:var(--brand)}" +
    ".hero p.lead{color:var(--ink);font-weight:700}" +
    ".badges{gap:12px 26px;color:var(--ink)}.badges b{color:var(--ink)}.st-check{display:inline-flex;align-items:center;gap:8px;color:var(--ink);font-weight:700}" +
    ".st-check i{width:20px;height:20px;border-radius:50%;background:var(--brand);display:inline-grid;place-items:center;flex:none}" +
    ".st-check i::after{content:\"\";width:8px;height:5px;border:2px solid #fff;border-top:0;border-right:0;transform:rotate(-45deg) translate(1px,-1px)}" +
    ".eyebrow{color:var(--brand)}h2.title{font-weight:900}" +
    ".item{border-color:var(--line)}.item:hover{box-shadow:0 14px 34px rgba(0,0,0,.12)}.item .thumb{background-color:#fff}" +
    ".item .price{color:var(--ink)}.item .view,.cat .go{color:var(--brand)}" +
    ".item .thumb .fallback{background:var(--panel2)}" +
    ".cat:hover,.st-site:hover,.st-chip:hover{border-color:var(--ink)}" +
    ".cat .ico{width:48px;height:48px;border-radius:50%;background:var(--brand);display:grid;place-items:center;font-size:22px}" +
    ".about{background:var(--panel2);border:0}" +
    ".band{background:#141414;color:#fff;position:relative;overflow:hidden;text-align:left}" +
    ".band::before{content:\"\";position:absolute;right:-70px;top:-70px;width:240px;height:240px;border-radius:50%;background:var(--brand)}" +
    ".band>*{position:relative}.band p{color:#e7e7e7}" +
    ".social{background:#fff;color:#141414}.social:hover{background:var(--brand);color:#fff}" +
    "footer{background:#141414;color:#bdbdbd;border-top:0}footer a:hover{color:#fff}";
  document.head.appendChild(css);

  /* ヒーロー・取り扱いを、eBayストアのバナーと同じ内容に（ページの設定があとから書き換えても戻す） */
  var CATS = [
    ["🎴", "Pokémon Cards", "ポケモンカード", "Japanese boosters, boxes & singles", "日本語版のパック・BOX・シングル", "pokemon"],
    ["🏴‍☠️", "One Piece Card Game", "ワンピースカード", "Japanese boosters & boxes", "日本語版のパック・BOX", "one piece card"],
    ["🗿", "Anime Figures", "アニメフィギュア", "Ichiban Kuji, P.O.P & more", "一番くじ・P.O.Pなど", "figure"]
  ];
  function brand() {
    var e = document.getElementById("brandEmoji");
    if (e && !e.querySelector("img")) e.innerHTML = '<img src="' + LOGO + '" alt="Sanuki Trading">';
    var h = document.getElementById("heroTitle");
    if (h && !h.querySelector(".st-en")) {
      h.innerHTML = bi('Authentic <span class="hl">Japanese</span> Collectibles', '日本の<span class="hl">本物</span>のコレクター商品を、<br>世界へ');
      if (!document.querySelector(".st-kicker")) h.insertAdjacentHTML("beforebegin", '<p class="st-kicker">Sanuki Trading · Kagawa, Japan</p>');
    }
    var l = document.getElementById("heroLead");
    if (l && !l.querySelector(".st-en")) l.innerHTML = bi("Pokémon Cards · One Piece Card Game · Anime Figures", "ポケモンカード・ワンピースカード・アニメフィギュア");
    var b = document.querySelector(".hero .badges");
    if (b && !b.querySelector(".st-check")) {
      var first = b.querySelector("span"); /* 出品数（自動で数が入る）は残す */
      b.innerHTML = "";
      if (first) b.appendChild(first);
      [["Ships from Japan, tracked", "日本から追跡つきで発送"], ["US import duties prepaid", "アメリカは関税込み"], ["Packs never searched", "パックはサーチしません"]].forEach(function (c) {
        b.insertAdjacentHTML("beforeend", '<span class="st-check"><i></i>' + bi(c[0], c[1]) + "</span>");
      });
    }
    var g = document.getElementById("catGrid");
    if (g && !g.querySelector(".st-en")) {
      g.innerHTML = CATS.map(function (c) {
        return '<a class="cat" href="' + SELLER_SEARCH + encodeURIComponent(c[5]) + '" target="_blank" rel="noopener"><div class="ico">' + c[0] + "</div><h3>" + bi(c[1], c[2]) + "</h3><p>" + bi(c[3], c[4]) + '</p><div class="go">' + bi("Shop now →", "見る →") + "</div></a>";
      }).join("");
    }
  }
  brand();

  css = document.createElement("style");
  css.textContent =
    'html[data-lang="en"] .st-ja{display:none!important}html[data-lang="ja"] .st-en{display:none!important}' +
    ".st-langs{display:inline-flex;border:1.5px solid var(--line,#28303f);border-radius:999px;overflow:hidden;margin-left:auto;margin-right:12px;flex:none}" +
    ".st-langs a{padding:6px 12px;font-size:13px;font-weight:700;color:var(--muted,#9aa6b8)}" +
    'html[data-lang="en"] .st-langs a[data-l="en"],html[data-lang="ja"] .st-langs a[data-l="ja"]{background:var(--ink,#eef1f6);color:var(--bg,#0b0e14)}' +
    ".st-sec{padding:56px 0 0}.st-sec h2{font-size:clamp(24px,4vw,32px);margin:6px 0 8px}" +
    ".st-eyebrow{color:var(--accent,#f43f5e);font-weight:800;font-size:13px;letter-spacing:.12em;text-transform:uppercase;margin:0}" +
    ".st-sub{color:var(--muted,#9aa6b8);margin:0 0 20px}" +
    ".st-sites{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}" +
    ".st-site{display:flex;flex-direction:column;gap:2px;padding:14px 16px;background:var(--panel,#141924);border:1px solid var(--line,#28303f);border-radius:var(--radius,16px);min-width:0}" +
    ".st-site:hover{border-color:var(--brand,#3b82f6)}.st-site b{font-size:15px}.st-site span{font-size:12px;color:var(--muted,#9aa6b8)}" +
    ".st-box{background:var(--panel,#141924);border:1px solid var(--line,#28303f);border-radius:var(--radius,16px);padding:24px}" +
    ".st-notes{display:grid;border-top:1px solid var(--line,#28303f);margin:16px 0 0}" +
    ".st-notes a{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:baseline;padding:13px 0;border-bottom:1px solid var(--line,#28303f);font-size:15px}" +
    ".st-notes a:hover .st-t{text-decoration:underline}.st-t{display:flex;flex-direction:column;gap:2px;min-width:0}" +
    ".st-d{font-size:12px;color:var(--muted,#9aa6b8)}.st-p{font-size:13px;font-weight:700;white-space:nowrap}.st-p.free{color:var(--accent,#f43f5e)}" +
    ".st-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}" +
    ".st-chip{padding:8px 16px;border:1.5px solid var(--line,#28303f);border-radius:999px;font-weight:700;font-size:14px}.st-chip:hover{border-color:var(--brand,#3b82f6)}" +
    "@media (max-width:700px){.st-sites{grid-template-columns:repeat(2,minmax(0,1fr))}.st-box{padding:18px}}";
  document.head.appendChild(css);

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function bi(en, ja) { return '<span class="st-en">' + en + '</span><span class="st-ja">' + ja + "</span>"; }

  /* 言語ボタン（上のメニュー） */
  var navWrap = document.querySelector("nav .wrap");
  if (navWrap) {
    var langs = el('<div class="st-langs" role="group" aria-label="Language"><a href="#en" data-l="en" lang="en">EN</a><a href="#ja" data-l="ja" lang="ja">日本語</a></div>');
    var links = navWrap.querySelector(".nav-links");
    navWrap.insertBefore(langs, links || null);
  }

  /* 8か国のeBay と 店主の話（note・LINE・SNS）を「お店について」の後ろに足す */
  var sitesHtml = SITES.map(function (s) {
    return '<a class="st-site" href="' + s[0] + '" target="_blank" rel="noopener"><b>' + bi(s[1], s[2]) + "</b><span>" + s[3] + "</span></a>";
  }).join("");
  function noteRow(n) {
    var p = n.price ? '<span class="st-p">' + Number(n.price).toLocaleString("ja-JP") + "円</span>" : '<span class="st-p free">無料</span>';
    return '<a href="' + esc(n.url) + '" target="_blank" rel="noopener"><span class="st-t"><span>' + esc(n.name) + '</span><span class="st-d">' + esc(n.date) + "</span></span>" + p + "</a>";
  }
  var notesHtml = NOTES.map(noteRow).join("");
  var snsHtml = SNS.map(function (s) {
    return '<a class="st-chip" href="' + s[1] + '" target="_blank" rel="noopener">' + s[0] + "</a>";
  }).join("");

  var add = el(
    '<div class="st-add">' +
      '<section class="st-sec" id="local"><div class="wrap">' +
        '<p class="st-eyebrow">' + bi("Shop locally", "海外のeBay") + "</p>" +
        "<h2>" + bi("Shop on your country's eBay", "海外のeBayサイトでも買えます") + "</h2>" +
        '<p class="st-sub">' + bi("Our store is open on eight eBay sites. Choose yours to see prices in your currency.", "8か国のeBayにお店を出しています。お住まいの国を選ぶと、その国の通貨で見られます。") + "</p>" +
        '<div class="st-sites">' + sitesHtml + "</div>" +
        '<p class="st-sub" style="margin-top:16px">' + bi("Looking for a Japanese item? Message us on eBay. We will do our best to find it, though we cannot guarantee availability or price.", "日本の商品で探しているものがあれば、eBayのメッセージでお知らせください。必ず見つかる・この値段で、とはお約束できませんが、できるかぎり探します。") + "</p>" +
      "</div></section>" +
      '<section class="st-sec" id="owner"><div class="wrap"><div class="st-box">' +
        '<p class="st-eyebrow">' + bi("From the owner", "店主の話") + "</p>" +
        "<h2>" + bi("Run by one person in Japan", "「明るくなったね」") + "</h2>" +
        '<p class="st-sub st-en">The owner writes, in Japanese, about running the shop day to day with help from AI.</p>' +
        '<p class="st-sub st-ja">そう言われるようになるまでの店主の話を、noteに書いています。お店を続けながら、毎日の作業の一部をAIに任せるようになるまでの記録です。</p>' +
        '<p class="st-ja" style="margin:0;font-weight:800">noteの新しい記事</p>' +
        '<div class="st-notes st-ja">' + notesHtml + "</div>" +
        '<div class="st-row">' +
          '<a class="btn" href="https://note.com/sanukitrading/n/n62e7064ee02f" target="_blank" rel="noopener">' + bi("Read on note (Japanese, free) →", "無料で読む →") + "</a>" +
          '<a class="btn ghost st-ja" href="https://line.me/R/ti/p/@619sptqi" target="_blank" rel="noopener">LINEで新しい話のお知らせを受け取る →</a>' +
        "</div>" +
        '<div class="st-row">' + snsHtml + "</div>" +
      "</div></div></section>" +
    "</div>"
  );
  var about = document.getElementById("about");
  if (about && about.parentNode) about.parentNode.insertBefore(add, about.nextSibling);
  else document.body.appendChild(add);

  /* noteの新しい記事：notes.json（GitHubが3時間ごとにnoteから自動で作る）があれば、そちらに入れ替える */
  fetch("notes.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (list) {
    if (!list || !list.length) return;
    list = list.filter(function (n) { return n && /^https:\/\/note\.com\/sanukitrading\/n\/[a-z0-9]+$/.test(n.url) && n.name; }).slice(0, 5);
    var box = document.querySelector(".st-notes");
    if (box && list.length) box.innerHTML = list.map(noteRow).join("");
  }).catch(function () {});

  /* 今のページの英語を日本語に（元の英語は覚えておき、ENで戻す） */
  var orig = new WeakMap(), touched = [];
  var reUpd = /^Last updated:\s*(.+)$/;
  function walk(fn) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var p = n.parentElement;
      if (!p || p.closest("script,style,.st-add,.st-langs")) continue;
      fn(n);
    }
  }
  function toJa() {
    walk(function (n) {
      var t = n.textContent.trim(); if (!t) return;
      var ja = JA[t], m;
      if (!ja && (m = t.match(reUpd))) ja = "最終更新：" + m[1];
      if (!ja) return;
      if (!orig.has(n)) { orig.set(n, n.textContent); touched.push(n); }
      n.textContent = n.textContent.replace(t, ja);
    });
  }
  function toEn() {
    touched.forEach(function (n) { if (orig.has(n)) n.textContent = orig.get(n); });
    touched = []; orig = new WeakMap();
  }
  var busy = false;
  function setLang(l) {
    lang = l; root.setAttribute("data-lang", l); root.lang = l;
    busy = true; if (l === "ja") toJa(); else toEn(); busy = false;
  }
  setLang(lang);

  /* 商品一覧などがあとから描かれても、日本語のままにする */
  var timer = null;
  new MutationObserver(function () {
    if (busy) return;
    clearTimeout(timer); timer = setTimeout(function () { busy = true; brand(); if (lang === "ja") toJa(); busy = false; }, 60);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  window.addEventListener("hashchange", function () {
    var h = (location.hash || "").replace("#", "");
    if (h === "ja" || h === "en") setLang(h);
  });
})();
