# eBay Store Showcase Site (auto-updating, free)

あなたのeBayストアを紹介し、**新商品が出るたびに自動で掲載して集客する**無料サイトです。

- 🆓 完全無料(GitHub Pages)
- 🤖 毎日自動更新(GitHub Actions + eBay公式Browse API)
- 🔐 eBayのログイン情報は不要。APIキーは暗号化Secretsに保管
- 🔗 誘導は「サイト → eBay」の一方向で、サスペンドに配慮

## セットアップ

👉 **[セットアップ手順.md](./セットアップ手順.md)** を上から順に進めてください(約10〜15分、初回のみ)。

## ファイル構成

| ファイル | 役割 | 編集する? |
|---|---|---|
| `index.html` | サイト本体(デザイン) | 基本そのまま |
| `config.json` | 店名・URL・カテゴリなどの設定 | ✅ あなたが編集 |
| `data.json` | 商品データ(自動生成・自動更新) | ❌ 触らない |
| `scripts/fetch-ebay.mjs` | eBayから商品を取得するスクリプト | ❌ 触らない |
| `.github/workflows/update.yml` | 毎日の自動更新スケジュール | 必要なら時間だけ変更可 |

## 必要な GitHub Secrets

| 名前 | 中身 |
|---|---|
| `EBAY_CLIENT_ID` | eBay Developer の App ID (Client ID) |
| `EBAY_CLIENT_SECRET` | eBay Developer の Cert ID (Client Secret) |
