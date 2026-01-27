# しおり（Bookmark）生成機能 技術仕様書

## 概要

旅のしおり生成機能は、ユーザーの入力情報をもとに AI（Google Gemini Image Generation）を活用してビジュアルなしおりを自動生成する機能です。

---

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          フロントエンド                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │  TripForm   │───▶│TabiNoteApp  │───▶│ TripPreview │                │
│  │  (入力)     │    │ (フロー制御)  │    │  (表示)     │                │
│  └─────────────┘    └──────┬──────┘    └─────────────┘                │
│                            │                                           │
│                            ▼                                           │
│                    ┌───────────────┐                                   │
│                    │ CanvasEditor  │ ◀── 新規追加                      │
│                    │  (編集)       │                                   │
│                    └───────────────┘                                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          バックエンド                                    │
│  ┌─────────────────┐    ┌─────────────────┐                           │
│  │ /api/design     │───▶│ Gemini Image    │                           │
│  │ (APIルート)      │    │ Generation API  │                           │
│  └─────────────────┘    └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 関連ファイル一覧

### フロントエンドコンポーネント

| ファイル | 役割 |
|---------|------|
| `src/components/TabiNoteApp.tsx` | メインアプリケーション・生成フロー制御 |
| `src/components/TripForm.tsx` | しおり作成フォーム（4ステップ） |
| `src/components/TripPreview.tsx` | プレビュー表示 |
| `src/components/PdfExport.tsx` | PDF書き出し機能 |
| `src/components/ShioriShowcase.tsx` | サンプルしおり表示スライダー |

### エディタコンポーネント（新規追加）

| ファイル | 役割 |
|---------|------|
| `src/components/editor/CanvasEditor.tsx` | キャンバスベースのしおりエディタ本体 |
| `src/components/editor/CanvasStage.tsx` | Konva.jsベースの描画ステージ |
| `src/components/editor/panels/TextStylePanel.tsx` | テキストスタイル編集パネル |
| `src/components/editor/panels/ImageUploadPanel.tsx` | 画像アップロード・編集パネル |
| `src/components/editor/hooks/useCanvasState.ts` | エディタ状態管理フック |
| `src/components/editor/hooks/useExportCanvas.ts` | 画像書き出しフック |
| `src/components/editor/layers/BackgroundLayer.tsx` | AI生成背景画像レイヤー |
| `src/components/editor/elements/EditableText.tsx` | 編集可能テキスト要素 |
| `src/components/editor/elements/ImageSlot.tsx` | 画像スロット要素 |

### ビジネスロジック・API

| ファイル | 役割 |
|---------|------|
| `src/lib/ai.ts` | AI補完コンテンツ生成（ローカル処理） |
| `src/lib/storage.ts` | データストレージ（Supabase/localStorage） |
| `src/app/api/design/route.ts` | デザイン画像生成API（Gemini連携） |

### テンプレートシステム

| ファイル | 役割 |
|---------|------|
| `src/lib/templates/index.ts` | テンプレート統合エクスポート |
| `src/lib/templates/types.ts` | テンプレート型定義・ユーティリティ |
| `src/lib/templates/base/index.ts` | 8種類のベーステンプレート定義 |
| `src/lib/templates/formats/index.ts` | 4種類のフォーマットモディファイア |
| `src/lib/templates/pages/index.ts` | 6種類のページレイアウト定義 |
| `src/lib/templates/pages/cover.ts` | 表紙ページレイアウト |

### データ定義

| ファイル | 役割 |
|---------|------|
| `src/types/trip.ts` | Trip、AiContent等のデータ型定義 |
| `src/types/editor.ts` | エディタ関連の型定義 |

---

## 生成フロー詳細

### Phase 1: ユーザー入力

```
┌─────────────────────────────────────────┐
│ Step 1: 基本情報入力                      │
│  - 旅のタイトル（必須）                    │
│  - 目的地（必須）                         │
│  - 出発日・帰着日（必須）                  │
│  - 移動手段                              │
│  - メンバー（複数追加可）                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ Step 2: 日程編集                         │
│  - 開始日〜終了日から日数を自動計算         │
│  - 各日のアクティビティ入力                │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ Step 3: 詳細情報入力                      │
│  - やりたいことリスト（WantItems）         │
│  - 宿泊施設情報（Lodging）                │
│  - メモ・その他                          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ Step 4: テンプレート・AI設定              │
│  - テンプレート選択（8種類）               │
│  - フォーマット選択（4種類）               │
│  - AI補完機能ON/OFF                      │
│  - AI文章トーン選択（丁寧/カジュアル）      │
└─────────────────────────────────────────┘
```

### Phase 2: AI補完コンテンツ生成（ローカル処理）

**処理場所**: `src/lib/ai.ts`

AI補完コンテンツはGemini APIを使用せず、ローカルでテンプレートベースの生成を行います。

```typescript
interface AiContent {
  coverCopy: string;                     // 表紙用キャッチコピー
  overviewText: string;                  // 旅の概要文
  daySummaries: Record<number, string>;  // 各日の見どころ要約
  cautionsText: string;                  // 注意事項
  packingSuggestions: string[];          // 持ち物提案
}
```

#### カバーコピー（ランダム選択）

```typescript
const coverCopies = [
  `${destination}で過ごす、忘れられない${days}日間`,
  `心に残る旅へ - ${destination}の冒険`,
  `${destination}で創る、特別な思い出`,
  `さぁ、${destination}へ出かけよう！`,
];
```

#### 概要テキスト（トーン別）

| トーン | 例 |
|-------|-----|
| polite | 「この度は〜への旅行をお楽しみください...」 |
| casual | 「〜への旅、楽しみだね！〜人で最高の思い出作ろう！」 |

#### 持ち物提案（固定テンプレート）

1. 着替え（日数分+予備1組）
2. 洗面用具・タオル
3. 常備薬・保険証
4. スマートフォン充電器
5. 雨具（折りたたみ傘）
6. カメラ・モバイルバッテリー
7. 日焼け止め
8. エコバッグ

### Phase 3: デザイン画像生成（Gemini API）

**処理場所**: `src/app/api/design/route.ts`

#### API概要

| 項目 | 値 |
|-----|-----|
| エンドポイント | `https://generativelanguage.googleapis.com/v1beta/models/{MODEL_ID}:generateContent` |
| モデルID | `gemini-3-pro-image-preview`（環境変数 `GEMINI_IMAGE_MODEL` で制御） |
| 認証 | `GEMINI_API_KEY` 環境変数 |

#### リクエスト形式

```typescript
{
  contents: [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ],
  generationConfig: {
    temperature: 0.1,  // full mode（0.6 for background mode）
    responseModalities: ["IMAGE"]
  }
}
```

#### レスポンス形式

- Base64 エンコードされた PNG 画像
- MIME Type: `image/png`
- 解析パス: `json.candidates[0].content.parts[0].inlineData.data`

#### レンダリングモード

| モード | 説明 | 温度 | 用途 |
|-------|------|------|------|
| `background` | 背景画像のみ生成（テキストなし） | 0.6 | エディタの背景レイヤー用 |
| `full` | テキストを含む完成ページ画像 | 0.1 | 直接印刷・プレビュー用 |

### Phase 4: ページ構成決定

**処理場所**: `src/components/TabiNoteApp.tsx` (`generateDesignPages`)

```typescript
const pageRequests = [
  { mode: "cover", label: "表紙" },
  { mode: "overview", label: "概要" },
  // 日程ページ（日数分繰り返し）
  ...trip.dayPlans.map((plan) => ({
    mode: "schedule",
    label: `Day ${plan.day}`,
    day: plan.day,
  })),
  // チェックリスト（条件付き）
  // 情報ページ（条件付き）
  { mode: "memo", label: "メモ" },
];
```

#### ページ生成条件

| ページ | 生成条件 |
|-------|---------|
| cover | 常に生成 |
| overview | 常に生成 |
| schedule | 日数分繰り返し |
| checklist | `packingSuggestions` または `wantItems` がある場合 |
| info | `lodgings`、`transportText`、`cautionsText`、`notes` のいずれかがある場合 |
| memo | 常に生成 |

---

## プロンプトエンジニアリング

### スタイルガイド構成

各テンプレートには以下の属性が定義されています（`styleGuides`）：

| 属性 | 説明 | 例（minimal） |
|-----|------|--------------|
| mood | デザインの雰囲気 | "minimal, clean, airy, editorial, structured, warm ink on paper" |
| palette | カラーパレット | "ink deep #1a1a2e, paper cream #faf8f5, paper aged #ede4d4" |
| motifs | 装飾要素 | "thin rules, gentle grids, generous whitespace, subtle paper grain" |
| typography | フォント指定 | "Display: Cormorant Garamond, Body: Zen Kaku Gothic New, UI: DM Sans" |
| imagery | 画像・イラストの扱い | "Use one calm hero photo or line art illustration" |

### フォーマットガイド

各フォーマットのレイアウト指示（`formatGuides`）：

| フォーマット | レイアウト指示 |
|------------|---------------|
| classic | "Use a clean editorial grid with a header band and 2-3 content cards" |
| collage | "Use overlapping photo frames, washi tape, and scrapbook layers" |
| notebook | "Use paper textures, ruled areas, and sticky-note accents" |
| timeline | "Emphasize a vertical timeline with dotted guides and step markers" |

### ページ別レイアウトガイド

各ページモードの構成指示（`modeGuides`）：

| モード | レイアウト指示 |
|-------|---------------|
| cover | "a thin header band at top, a centered title block, 2-3 pill chips for dates/destination/members" |
| overview | "header band with icon, then two main cards (overview, transport/lodging)" |
| schedule | "header band, highlight summary block, then a vertical numbered list/timeline" |
| checklist | "header band, two columns of checkbox rows (packing/wish)" |
| info | "header band, two bordered info blocks (lodging/notes)" |
| memo | "header band, then a large lined or dotted paper area for notes" |

### Full Mode プロンプトの厳格ルール

```
STRICT RULES:
1) This is a copy task: render EVERY line exactly as provided,
   preserving all characters and punctuation.
2) Do not add, translate, rephrase, or remove any characters.
   Do not invent labels.
3) Use only characters that appear in TEXT_LINES_JSON.
   Do not add Latin letters unless they are in the lines.
4) Do not place any text on stickers, illustrations, maps, stamps,
   or tickets. Use icon-only motifs.
5) If text is long, reduce font size, tighten spacing, or use
   multi-column layout. Do not omit any lines.
6) Keep punctuation, small Japanese characters, and digits intact.
7) Absolutely no decorative words like TRAVEL, DESTINATION, DATES, etc.
```

### TEXT_LINES_JSON の構築

各ページモードに応じたテキスト行の配列を構築：

```typescript
// cover モードの例
const textLines = [
  title,                              // "沖縄旅行"
  coverCopy,                          // "沖縄で過ごす、忘れられない3日間"
  `目的地：${destination}`,            // "目的地：沖縄"
  `日程：${dates}`,                    // "日程：2024-03-15 〜 2024-03-17"
  `メンバー：${members}`,              // "メンバー：田中・山田・佐藤"
  `${pageNumber}/${totalPages}`       // "1/6"
];
```

---

## テンプレートシステム

### テンプレートタイプ（8種類）

| ID | 名前 | カラーパレット |
|----|------|--------------|
| `minimal` | ミニマル | ink deep, paper cream, gold accent |
| `pop` | ポップ | terracotta, gold, coral |
| `photo` | 写真多め | ocean, sage, warm paper |
| `retro` | レトロ | aged paper, terracotta, gold |
| `romantic` | ロマンチック | coral, cream, blush |
| `modern` | モダン | ink deep, warm paper, gold |
| `nature` | ナチュラル | sage, warm paper, coral |
| `adventure` | アドベンチャー | ocean, terracotta, aged paper |

### フォーマットタイプ（4種類）

| ID | 名前 | グリッドスタイル |
|----|------|----------------|
| `classic` | スタンダード | clean（クリーンなグリッド） |
| `collage` | コラージュ | overlap（重なり合うレイヤー） |
| `notebook` | ノート | lined（罫線付き） |
| `timeline` | タイムライン | vertical（縦型タイムライン） |

### ページレイアウト定義

各ページはゾーン（配置エリア）で構成されます：

```typescript
interface PageLayout {
  mode: DesignMode;
  zones: LayoutZone[];        // 配置ゾーン
  optionalSlots: [];          // オプションスロット（画像など）
  dataBindings: DataBinding[]; // Tripデータとの紐付け
}

interface LayoutZone {
  id: string;
  name: string;
  type: "header" | "title" | "content" | "footer" | "image" | "list";
  position: { x: number | "left" | "center" | "right"; y: number | "top" | "middle" | "bottom"; anchor: string };
  size: { width: number | "auto" | "fill"; height: number | "auto" | "fill" };
  locked: boolean;
  resizable: boolean;
  deletable: boolean;
  defaultStyle: Partial<TextElementData>;
}
```

---

## キャンバスエディタ

### 概要

React Konva（Konva.js）ベースのキャンバスエディタで、AI生成画像を背景としてテキストや画像要素を配置・編集できます。

### エディタ状態管理

```typescript
interface EditorState {
  currentPage: DesignMode;          // 現在のページ
  currentDayIndex?: number;         // 日程ページの場合の日数
  pages: Map<string, PageState>;    // ページごとの状態
  selectedElementId: string | null;  // 選択中の要素
  history: HistoryEntry[];          // Undo/Redo用履歴
  historyIndex: number;
  zoom: number;                     // ズーム倍率（0.25〜3.0）
  panOffset: Position;              // パン位置
  showGrid: boolean;                // グリッド表示
}

interface PageState {
  pageKey: string;                  // "cover" | "schedule-1" など
  mode: DesignMode;
  day?: number;
  elements: CanvasElement[];        // 配置要素
  aiBackground?: {                  // AI生成背景
    base64: string;
    mimeType: string;
  };
}
```

### キャンバス要素

```typescript
interface CanvasElement {
  id: string;
  type: "text" | "image" | "decoration";
  position: Position;
  size: Size;
  rotation: number;
  locked: boolean;
  visible: boolean;
  layer: number;
  textData?: TextElementData;
  imageData?: ImageElementData;
}
```

### 書き出し機能

```typescript
// 現在のキャンバスをPNG形式で書き出し
const dataUrl = canvasStageRef.current?.exportToDataUrl(pixelRatio);
```

---

## データ構造

### Trip インターフェース

```typescript
interface Trip {
  id: string;
  title: string;                    // 旅のタイトル
  destination: string;              // 目的地
  startDate: string;                // ISO形式
  endDate: string;                  // ISO形式
  transportText: string;            // 移動手段テキスト
  notes: string;                    // 自由メモ
  members: Member[];                // メンバー配列
  lodgings: Lodging[];              // 宿泊施設配列
  wantItems: WantItem[];            // やりたいことリスト
  dayPlans: DayPlan[];              // 日程計画
  templateType: TemplateType;       // スタイル（8種類）
  formatType: FormatType;           // フォーマット（4種類）
  aiEnabled: boolean;               // AI機能の有効化
  aiTone: "polite" | "casual";      // AI文章トーン
  aiContent?: AiContent;            // AI生成コンテンツ
  design?: TripDesign;              // デザイン＆画像データ
  shareToken?: string;              // 共有トークン
  createdAt: string;
  updatedAt: string;
}
```

### TripDesign（デザイン＆ページデータ）

```typescript
interface TripDesign {
  style: TemplateType;
  format: FormatType;
  renderMode: "background" | "full";
  assets?: Partial<Record<DesignMode, TripDesignImage>>; // 背景モード用
  pages?: TripDesignPage[];                              // fullモード用
  updatedAt: string;
}

interface TripDesignPage {
  id: string;
  mode: DesignMode;
  label: string;
  day?: number;
  pageNumber: number;
  totalPages: number;
  mimeType: string;
  base64: string;
  prompt?: string;
  createdAt: string;
}
```

---

## データ永続化

### 保存先

| 優先度 | ストレージ | 詳細 |
|-------|----------|------|
| 1 | Supabase | テーブル: `trips` / カラム: `id`, `payload` (JSON), `share_token`, `created_at`, `updated_at` |
| 2 | localStorage | Key: `tabiNote_trips` / 値: Trip[] (JSON配列) |

### 注意事項

- デザイン画像（Base64）は localStorage の容量制限対策として、保存時に `pages: []` で空にされる
- 読み込み時に自動正規化（`normalizeTrip`）が実行される
- 共有機能利用時は Supabase に保存

### 共有機能

- Share Token: ランダム生成（`Math.random().toString(36).slice(2, 14)`）
- URL形式: `/share/{shareToken}`
- Supabase でトークンベースに検索

---

## PDF出力

### 用紙サイズオプション

| サイズ | 寸法 | 備考 |
|-------|------|------|
| A4 | 210×297mm | 縦/横選択可 |
| A5 | 148×210mm | 冊子用、縦/横選択可 |
| しおりサイズ | 55×180mm | 固定 |

### 生成方式

```javascript
// 新しいウィンドウを開き、HTMLを出力
const printWindow = window.open("", "_blank");
printWindow.document.write(html);
window.print(); // ブラウザの印刷ダイアログ
```

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React 18, Next.js 14 (App Router), TypeScript |
| UIフレームワーク | Tailwind CSS, Framer Motion |
| キャンバス | Konva.js, React-Konva |
| アイコン | Lucide React |
| バックエンド | Next.js API Routes |
| AI画像生成 | Google Gemini Image Generation API |
| データ | Supabase (PostgreSQL), localStorage |
| PDF生成 | ブラウザネイティブ print API |

---

## 環境変数

| 変数名 | 説明 | デフォルト |
|-------|------|----------|
| `GEMINI_API_KEY` | Gemini API認証キー | (必須) |
| `GEMINI_IMAGE_MODEL` | 使用するGeminiモデルID | `gemini-3-pro-image-preview` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | (オプション) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー | (オプション) |

---

## フロー図（完全版）

```
ユーザー入力（TripForm）
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ TabiNoteApp.handleSaveTrip                                 │
│  1. Trip データ構造を作成                                    │
│  2. aiEnabled ? generateAiContent(trip) : undefined        │
│  3. storage.saveTrip(trip) で保存                          │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ TabiNoteApp.generateDesignPages (ループ処理)                │
│  for each page in [cover, overview, schedule×N, ...]      │
│    ├─ requestDesign(trip, mode, options)                  │
│    │    └─ POST /api/design { trip, mode, renderMode }    │
│    │         │                                             │
│    │         ▼                                             │
│    │    ┌─────────────────────────────────────────┐       │
│    │    │ /api/design/route.ts                     │       │
│    │    │  1. buildFullPrompt() でプロンプト構築     │       │
│    │    │  2. Gemini API に送信                    │       │
│    │    │  3. Base64画像を返却                     │       │
│    │    └─────────────────────────────────────────┘       │
│    └─ pages.push({ mode, base64, ... })                   │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ trip.design = { pages, renderMode: "full", ... }           │
│ storage.saveTrip(trip)                                     │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ TripPreview で画像表示                                      │
│  └─ 「デザイン編集」ボタン → CanvasEditor                   │
│  └─ 「PDF書き出し」ボタン → PdfExport                      │
│  └─ 「共有」ボタン → 共有リンク発行                         │
└───────────────────────────────────────────────────────────┘
```

---

## 今後の拡張ポイント

1. **背景モード活用**: `renderMode: "background"` で背景のみ生成し、テキストはCanvasEditorで配置（より柔軟な編集）
2. **リアルタイムコラボ**: Supabase Realtime を使った共同編集
3. **テンプレートカスタマイズ**: ユーザーが独自テンプレートを保存
4. **画像アップロード**: ユーザー写真をしおりに配置
5. **多言語対応**: プロンプトとUIの国際化
