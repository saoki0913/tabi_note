# たびNote

国内旅行の幹事向けに、旅のしおりを最短5分で作る Next.js アプリです。入力 → AI補完 → ページ生成 → プレビュー → ページ修正 → 共有/PDF までを一つの導線にまとめています。

## 現在の構成

- App: Next.js 14 / App Router / Vercel 想定
- Auth: Better Auth + Google ログイン
- DB: Turso + Drizzle
- Asset storage: Cloudflare R2
- Billing: Stripe Checkout / Billing Portal / Webhook
- Analytics: PostHog

## 料金設計

- Free: 月3件まで生成、ログイン後に保存可能
- Premium: 月額480円 / 年額3,900円
- Premium 特典: PDF、共有リンク、ページごとの再生成、高解像度出力

## ローカル起動

1. 依存関係をインストール

```bash
npm install
```

2. `.env.local` を `.env.example` から作成し、最低限以下を設定

- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `TURSO_DATABASE_URL`
- `GEMINI_API_KEY`

3. スキーマをローカルDBに反映

```bash
npm run db:migrate
```

4. 開発サーバーを起動

```bash
npm run dev
```

## よく使うコマンド

```bash
npm run lint
npm run build
npm run db:generate
npm run db:migrate
```

## 主要ルート

- `/`: LP
- `/app`: しおり作成
- `/account`: 保存済みしおりと契約状況
- `/pricing`: 料金
- `/share/[token]`: 閲覧専用共有ページ
- `/compare/tabiori`, `/compare/canva`: 比較導線

## 運用メモ

- ゲスト下書きは `localStorage`
- ログイン後の保存先は Turso
- ページ画像と PDF は R2 保存を優先し、未設定時は fallback base64 を使う
- `npm run lint` と `npm run build` が通る状態を PR の最低条件にする

## 関連ドキュメント

- `docs/SPEC.md`
- `docs/WORKFLOW.md`
- `docs/shiori-generation-flow.md`
