# たびNote

旅のしおりを5分で作れるWebアプリ。入力 → 生成 → プレビュー → 共有/PDF出力の流れで使います。

## 環境構成

### 開発環境（ローカル）
- フロントエンド: Next.js 14 (App Router)
- DB/API/認証: Supabase local stack (Docker)
- クライアント: `@supabase/supabase-js`
- Supabase Studio: `http://127.0.0.1:54323`

ローカルは Supabase のローカルスタックを起動するため、同じ Supabase クライアントコードで開発できます。

### 本番環境
- フロントエンド: Vercel などでホスティング
- DB/API/認証: Supabase (hosted)
- クライアント: `@supabase/supabase-js` (環境変数のみ切り替え)

## 開発環境の立ち上げ

前提:
- Node.js / npm
- Docker Desktop

手順:
1) 依存関係のインストール
```bash
npm install
```

2) Supabase local stack を起動
```bash
npm run supabase:start
```

3) ローカルの接続情報を取得
```bash
npm run supabase:status -- --output env
```

4) `tabi_note/.env.local` を作成/更新（`.env.example` を参考）
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEYを貼る>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEYを貼る>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
GEMINI_API_KEY=<GEMINI_API_KEYを貼る>
GEMINI_IMAGE_MODEL=gemini-3-p-preview
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5) 起動
```bash
npm run dev
```

停止:
```bash
npm run supabase:stop
```

## 開発再開の手順

1) 最新の状態を取得（必要な場合）
```bash
git pull
```

2) 変更状態を確認
```bash
git status -sb
```

3) Supabase local stack の状態確認（止まっていれば起動）
```bash
npm run supabase:status -- --output env
# もし止まっていたら
npm run supabase:start
```

4) `.env.local` が未設定/古い場合は更新（`.env.example` と `supabase:status` を参照）

5) アプリ起動
```bash
npm run dev
```

### Codex で再開する場合
以下を Codex に指示してください（自律再開テンプレ）:
```
`tabi_note/.codex/commands/dev-continue.md` に従ってください。
docs/SPEC.md・docs/WORKFLOW.md・README.md・TODO/FIXME・UI/UXの完成形(/Users/saoki/work/figma/tabi_note)を確認し、必要な機能を自律的に洗い出して実装してください。
`.codex/skills` に追加したスキルの `SKILL.md` を確認し、該当するものは必ず適用してください。
1タスクずつ小さく進め、完了/未完了の更新を継続してください。
仕様・デザイン・運用ルールと矛盾がある場合は修正方針を提案し、判断が必要なときだけ質問してください。
実行したコマンド（lint/build等）と未実行理由を明記してください。
UI/UXの作成・改善には https://www.shokasonjuku.com/ux-psychologyを参考にすること。
作業がすべて完了したら、最後に「次にやるとよいこと」を出力してください。
```

## 開発フロー / ブランチ / PR
詳細は `docs/WORKFLOW.md` を参照してください（Worktree運用も含む）。

## 補足
- `.env.local` はコミットしません。必要なキーは `.env.example` に記載します。
- `docker-compose.yml` は従来の Postgres 単体構成用です。現在は Supabase local stack を推奨します。
- UX 改善の参考: https://www.shokasonjuku.com/ux-psychology
