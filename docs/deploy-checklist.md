# デプロイ準備チェックリスト

## 1. Vercel 環境変数

必須:

- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `TURSO_DATABASE_URL`
- `GEMINI_API_KEY`

認証:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

課金:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_YEARLY_PRICE_ID`

保存:

- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BASE_URL`

計測:

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

任意:

- `GEMINI_IMAGE_MODEL`
- `GEMINI_TEXT_MODEL`
- `TURSO_AUTH_TOKEN`

## 2. 外部サービス設定

### Google OAuth

- Authorized JavaScript origins に local / staging / production の URL を追加
- Redirect URI に local / staging / production の Better Auth callback URL を追加
- staging は `develop` branch の固定 URL、production は `main` の本番 URL を使う
- 公開前に staging と production の両方でログイン確認

### Stripe

- 月額480円、年額3,900円の Price を作成
- Checkout success / cancel URL を本番ドメインへ設定
- Webhook に `/api/webhooks/stripe` を登録
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Turso

- 本番DB作成
- `npm run db:migrate` 実行
- Better Auth 標準テーブル、`booklets`、`booklet_pages`、`usage_meters`、`subscriptions`、`share_links` の作成確認

### Cloudflare R2

- private バケットを用意
- ページ画像と PDF の書き込み確認
- 未設定環境では fallback base64 でも動作することを確認

## 3. ローンチ前 QA

- ゲストで3件まで生成できる
- 4件目で paywall が出る
- Google ログイン後に保存できる
- Free では PDF / 共有 / ページ再生成がブロックされる
- Premium 購入後に即時反映される
- Billing Portal から解約できる
- 共有リンクが `/share/[token]` で開く
- `npm run lint`
- `npm run build`

## 4. 法務と導線

- `/terms`
- `/privacy`
- `/commerce`
- フッターから常時到達できる
- 問い合わせ先メールが有効

## 5. 計測イベント

- `$pageview`
- `generation_started`
- `generation_succeeded`
- `generation_failed`
- `login_required_shown`
- `trip_saved`
- `paywall_viewed`
- `checkout_started`
- `share_created`
- `pdf_exported`
- `page_regenerated`
