# 開発フロー

このドキュメントは「ブランチ運用ルール」と「CI/PRの流れ」をまとめたものです。

## ブランチ運用ルール
- `main`: 本番用。default branch。`develop` からの PR だけを受ける。
- `develop`: staging 用。feature branch の統合先。
- `feature/<topic>`: 新機能・改善（例: `feature/trip-form`）
- `fix/<topic>`: バグ修正（例: `fix/share-link`）
- `docs/<topic>`: ドキュメント修正
- `chore/<topic>`: 環境整備や依存更新
- `refactor/<topic>`: 振る舞いを変えない内部整理
- `hotfix/<topic>`: 緊急対応（`main` から切る）

基本手順:
1) `develop` を最新化（`git fetch origin` / `git switch develop` / `git pull --ff-only origin develop`）
2) `origin/develop` から新しいブランチを作成
3) 変更をコミット
4) PR を作成して `develop` へマージ
5) staging 確認後に `develop` から `main` へ PR を作成して本番反映する

## コミット規約（軽量）
- 形式: `type: summary`
- type: `feat|fix|docs|chore|refactor|test`
- 例:
  - `feat: add trip form page`
  - `fix: prevent empty share link`
  - `docs: update workflow`

## Git Worktree（任意）
- 1ブランチ=1worktree
- 作成:
```bash
git fetch origin
git worktree add ../tabi-note-<topic> -b feature/<topic> origin/develop
```
- 管理: `git worktree list` / `git worktree prune`
- 削除: `git worktree remove <path>`

## CI/PRの流れ
GitHub Actions で `npm run lint` と `npm run build` が自動実行されます。

1) ローカルで品質チェック
```bash
npm run lint
npm run build
```

2) 変更をコミット
```bash
git add -A
git commit -m "feat: short summary"
```

3) リモートへ push
```bash
git push -u origin <branch>
```

4) PR を作成して `develop` へマージ（GitHubのUIでOK）
- 変更概要
- テスト内容（lint/build 実行有無）
- PR テンプレート: `.github/PULL_REQUEST_TEMPLATE.md`

5) staging 確認後に `develop -> main` の PR を作成して本番反映

補足:
- CI 定義: `.github/workflows/ci.yml`
- DB スキーマ更新がある場合は、`npm run db:migrate` を先に実行してから画面確認を行う。
