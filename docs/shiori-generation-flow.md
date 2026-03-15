# しおり生成フロー（現行実装・2026-03-11）

## 1. 全体フロー

1. ユーザーが旅の基本情報を入力
2. 必要なら AI が表紙コピー、概要文、日別要約、注意事項、持ち物候補を補完
3. 生成回数をチェック
   無料: 月3件まで
   Premium: 制限なし
4. ページ構成を決定
   表紙 / 概要 / 日別ページ / 持ち物 / 情報 / メモ
5. `POST /api/design` に full モードでページ単位生成を依頼
6. 生成した画像と編集用メタデータを `Trip.design.pages` に保持
7. ログイン済みなら Turso + R2 に保存
8. プレビュー画面でページ単位の修正、共有、PDF 出力へ進む

## 2. 編集フロー

1. プレビューで「ページを修正」を押す
2. 対象ページの `editableTextLines` と `fullModeStyle` を右パネルへ読み込む
3. 文言、順序、フォント、色を編集
4. 同じ `variantId` を使ってそのページだけ再生成
5. 差し替え後の画像を保存し、`isEdited` と `revision` を更新

初回リリースでは layered editor は使いません。生成方式は full のみです。

## 3. 保存と共有

- ゲスト下書き: `localStorage`
- 保存済みしおり: Turso
- 画像 / PDF: Cloudflare R2 を優先し、未設定時は fallback base64
- 共有リンク: `share_links` テーブルでトークン管理

## 4. 課金ゲート

- 保存: Google ログイン必須
- PDF: Premium のみ
- 共有リンク: Premium のみ
- ページ再生成: Premium のみ

## 5. 関連ファイル

- `src/components/BuilderApp.tsx`
- `src/components/TripForm.tsx`
- `src/components/TripPreview.tsx`
- `src/components/editor/FullModeLineEditor.tsx`
- `src/app/api/booklets/route.ts`
- `src/app/api/booklets/[id]/pages/[pageId]/regenerate/route.ts`
- `src/app/api/booklets/[id]/share/route.ts`
- `src/app/api/booklets/[id]/export/pdf/route.ts`
- `src/lib/booklets.ts`
- `src/lib/design/requestDesign.ts`
- `src/lib/export/pdf.ts`
