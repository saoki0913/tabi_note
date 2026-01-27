# しおり生成フロー

## 概要

旅のしおり（Travel Bookmark）生成システムのアーキテクチャと処理フローを説明します。

## 全体フロー図

```
ユーザー入力 → 旅データ保存 → ページ生成リクエスト → Design API
                                                    ↓
                            ┌─────────────────────────────────────────┐
                            │  1. レイアウト変種の自動選択            │
                            │  2. 背景画像用プロンプト生成            │
                            │  3. テキストレイヤー生成（ローカル）     │
                            │  4. Gemini APIで背景画像生成            │
                            └─────────────────────────────────────────┘
                                                    ↓
                                        背景画像 + テキストレイヤー
                                                    ↓
                                        エディタで表示・編集
```

---

## 1. Design API

### エンドポイント

`POST /api/design`

### リクエストパラメータ

```typescript
{
  trip: Trip                          // 旅の全データ
  mode: DesignMode                    // ページモード: cover|overview|schedule|checklist|info|memo
  renderMode?: DesignRenderMode       // レンダリングモード: "background" | "full" | "layered"
  pageNumber?: number                 // ページ番号（複数ページの場合）
  totalPages?: number                 // 全ページ数
  day?: number                        // スケジュール時の日番号
  variantId?: string                  // 使用する特定のレイアウト変種ID
  randomVariant?: boolean             // ランダムな変種選択（デフォルト：true）
}
```

### レンダリングモード

| モード | 説明 | 用途 |
|--------|------|------|
| `layered` | 背景画像とテキストレイヤーを分離 | **推奨**：エディタで編集可能 |
| `full` | 画像にテキスト埋め込み | レガシー（OCR必要） |
| `background` | 背景のみ（テキストなし） | カスタム用途 |

---

## 2. レイアウト変種システム

### 変種の構造

```typescript
interface LayoutVariant {
  id: string;           // 一意識別子
  name: string;         // 英語名
  nameJa: string;       // 日本語名
  description: string;  // 説明
  promptHint: string;   // Gemini APIへのレイアウト指示
  weight: number;       // 選択確率（加重ランダム）
}
```

### 各ページモードの変種

#### Cover（表紙）
| ID | 名前 | Weight |
|----|------|--------|
| `centered` | 中央配置 | 3 |
| `left-aligned` | 左寄せ | 2 |
| `photo-dominant` | 写真主体 | 2 |
| `card-stack` | カード重ね | 2 |
| `split` | 分割 | 1 |

#### Schedule（日程）
| ID | 名前 | Weight |
|----|------|--------|
| `timeline-left` | 左タイムライン | 3 |
| `timeline-center` | 中央タイムライン | 2 |
| `list-cards` | カードリスト | 2 |
| `journal` | ジャーナル風 | 2 |
| `grid` | グリッド | 1 |

#### Overview（概要）
| ID | 名前 | Weight |
|----|------|--------|
| `centered` | 中央配置 | 3 |
| `left-panel` | 左パネル | 2 |
| `bottom-heavy` | 下部集約 | 2 |

#### Checklist（チェックリスト）
| ID | 名前 | Weight |
|----|------|--------|
| `two-column` | 2列 | 3 |
| `stacked` | 縦並び | 2 |

#### Info（情報）
| ID | 名前 | Weight |
|----|------|--------|
| `card-sections` | カード型 | 3 |
| `sidebar-notes` | サイドバー | 2 |

#### Memo（メモ）
| ID | 名前 | Weight |
|----|------|--------|
| `lined` | 罫線 | 3 |
| `decorated` | 装飾付き | 2 |

### 変種選択ロジック

```typescript
// Trip IDとモード名から決定的なシードを生成
const baseSeed = trip.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
const modeSeed = mode.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
const seed = baseSeed + modeSeed + (day ?? 0);

// シードベースの加重ランダム選択
// → 同じTripなら常に同じ変種が選ばれる（一貫性）
variant = selectVariantForMode(mode, seed);
```

---

## 3. プロンプト生成

### 背景モード用（`buildBackgroundPrompt`）

- **温度設定**: 0.7（より創造的）
- **含まれる情報**:
  - デザイン方向（mood, palette, motifs, typography）
  - 構造ガイド（各ページの目的と推奨レイアウト）
  - フォーマットガイド（classic/collage/notebook/timeline）
  - 変種別ヒント（`promptHint`）
  - **「テキストを含めない」指示**

### 完全モード用（`buildFullPrompt`）

- **温度設定**: 0.35（より正確）
- **含まれる情報**:
  - 同じスタイル・フォーマットガイド
  - **TEXT_LINES_JSON**: JSONフォーマットのテキスト行リスト
  - 厳密なテキスト描画指示

---

## 4. テキストレイヤー生成

### 処理フロー（`generateTextLayers`）

```typescript
// 1. ページレイアウト取得
const layout = getPageLayout(mode);

// 2. 各ゾーンに対してテキストレイヤー生成
for (const zone of layout.zones) {
  if (zone.type === "image") continue;

  // データバインディング解決
  const binding = layout.dataBindings.find(b => b.zoneId === zone.id);
  const content = binding
    ? resolveDataBinding(binding, trip, mode, day)
    : getDefaultContent(zone, mode, day);

  if (!content) continue;

  // TextLayer生成
  layers.push({
    id: zone.id,
    zoneType: mapZoneType(zone.type),
    content,
    position: normalizePosition(zone),  // 0-1の正規化座標
    size: normalizeSize(zone),
    style: createLayerStyle(zone, trip),
    locked: zone.locked
  });
}
```

### TextLayer構造

```typescript
interface TextLayer {
  id: string;
  zoneType: ZoneType;           // title|subtitle|body|header|list-item等
  content: string;
  position: { x: number; y: number };  // 正規化座標（0-1）
  size: { width: number; height: number };
  style: TextLayerStyle;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  isUserAdded?: boolean;        // ユーザー追加フラグ
}
```

### 各ページモードのコンテンツ

#### Cover（表紙）
- タイトル
- サブタイトル（coverCopy）
- 目的地
- 日程（startDate 〜 endDate）
- メンバーリスト

#### Overview（概要）
- ヘッダー「旅のプラン」
- 概要テキスト
- 移動手段
- 宿泊先リスト

#### Schedule（日程）
- ヘッダー「Day N (YYYY-MM-DD)」
- 見どころ（daySummary）
- アクティビティリスト（番号付き）

#### Checklist（チェックリスト）
- ヘッダー「持ち物リスト」
- 持ち物（□ チェックボックス付き）
- やりたいこと（□ チェックボックス付き）

#### Info（情報）
- ヘッダー「インフォメーション」
- 宿泊先詳細
- 注意事項
- メモ

#### Memo（メモ）
- ヘッダー「メモ」
- 自由記入スペース

---

## 5. 完全な生成フロー

```
┌─────────────────────────────────────────────────────┐
│ 1. ユーザーが旅データを入力・保存                   │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 2. handleSaveTrip()実行                             │
│    - AI有効時：generateAiContent()で自動テキスト生成│
│    - 旅データをDBに保存                             │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 3. generateDesignPages()実行                        │
│    pageRequests = [                                 │
│      { mode: "cover", label: "表紙" },              │
│      { mode: "overview", label: "概要" },           │
│      ...dayPlans.map({ mode: "schedule", day: N }), │
│      { mode: "checklist", label: "持ち物" },        │
│      { mode: "info", label: "情報" },               │
│      { mode: "memo", label: "メモ" }                │
│    ]                                                │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 4. 各ページについて POST /api/design               │
│    {                                                │
│      trip: tripPayload,                             │
│      mode: "cover"|"overview"|...,                  │
│      renderMode: "layered",                         │
│      pageNumber: N,                                 │
│      totalPages: total,                             │
│      day: dayNumber (schedule時のみ)                │
│    }                                                │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 5. Design API処理                                   │
│    5.1. レイアウト変種選択                          │
│         → selectVariantForMode(mode, seed)          │
│                                                     │
│    5.2. プロンプト生成                              │
│         → buildBackgroundPrompt(trip, mode, variant)│
│                                                     │
│    5.3. テキストレイヤー生成（並列実行）            │
│         → generateTextLayers(trip, mode, day)       │
│                                                     │
│    5.4. Gemini Image APIに送信                      │
│         温度: 0.7 (背景モード)                      │
│         出力: 背景画像（base64）                    │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 6. API応答                                          │
│    {                                                │
│      base64: "画像のbase64",                        │
│      mimeType: "image/png",                         │
│      prompt: "使用したプロンプト",                   │
│      mode: "cover",                                 │
│      renderType: "layered",                         │
│      textLayers: [...],                             │
│      variantId: "centered",                         │
│      variantName: "Centered"                        │
│    }                                                │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 7. TripDesignPage作成・保存                         │
│    pages.push({                                     │
│      id: generateId(),                              │
│      mode: "cover",                                 │
│      label: "表紙",                                 │
│      pageNumber: 1,                                 │
│      totalPages: N,                                 │
│      base64: "...",                                 │
│      mimeType: "image/png",                         │
│      renderType: "layered",                         │
│      textLayers: [...],                             │
│      createdAt: ISO8601                             │
│    })                                               │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 8. Trip.designに保存                                │
│    trip.design = {                                  │
│      style: templateType,                           │
│      format: formatType,                            │
│      renderMode: "layered",                         │
│      pages: [...],                                  │
│      updatedAt: ISO8601                             │
│    }                                                │
└─────────────────────────────────────────────────────┘
```

---

## 6. エディタ機能

### 表示（LayeredPage）

- 背景画像を `<img>` で表示
- テキストレイヤーを HTML オーバーレイとして重ねて表示
- 正規化座標（0-1）をコンテナサイズに合わせてスケーリング

### 編集機能

| 機能 | 操作 |
|------|------|
| テキスト編集 | ダブルクリックで編集モード |
| レイヤー選択 | シングルクリックで選択 |
| 位置移動 | 選択状態でドラッグ&ドロップ |
| スタイル編集 | 選択状態で「スタイル」ボタン |
| テキスト追加 | 「テキスト追加」ボタン |

### 保存処理

```typescript
// DesignEditor.handleSave()
const updatedTextLayers = page.textLayers.map(layer => {
  const edit = layeredEdits.get(layer.id);
  if (!edit) return layer;

  return {
    ...layer,
    content: edit.content ?? layer.content,
    position: edit.position ?? layer.position,
    style: edit.style ? { ...layer.style, ...edit.style } : layer.style,
  };
});

// 新規追加レイヤーも含める
const allLayers = [...updatedTextLayers, ...newLayers];
```

---

## 7. ファイル構成

```
src/
├── app/api/design/route.ts          # Design API
├── lib/
│   ├── layers/
│   │   └── generator.ts             # テキストレイヤー生成
│   └── templates/
│       ├── baseTemplates.ts         # ベーステンプレート定義
│       ├── formatModifiers.ts       # フォーマット修飾子
│       ├── pageLayouts.ts           # ページレイアウト定義
│       └── variants/
│           ├── index.ts             # 変種エクスポート
│           ├── cover.ts             # Cover変種
│           ├── schedule.ts          # Schedule変種
│           ├── overview.ts          # Overview変種
│           ├── checklist.ts         # Checklist変種
│           ├── info.ts              # Info変種
│           └── memo.ts              # Memo変種
├── components/editor/
│   ├── DesignEditor.tsx             # メインエディタ
│   ├── PageRenderer.tsx             # ページルーティング
│   ├── LayeredPage.tsx              # レイヤードページ表示
│   ├── TextLayerRenderer.tsx        # テキストレイヤー描画
│   └── TextStyleEditor.tsx          # スタイル編集UI
└── types/
    └── trip.ts                      # 型定義
```

---

## 8. 重要な設計特性

| 特性 | 説明 |
|------|------|
| **決定的な変種選択** | Trip ID + モード名でシード化 → 同じTripなら常に同じデザイン |
| **正規化座標** | テキストレイヤーは0-1で正規化 → スケーリング時に自動調整 |
| **分離アーキテクチャ** | 背景（画像）と前景（テキスト）を分離 → 独立に編集可能 |
| **温度制御** | 背景モード(0.7)では創造性優先、完全モード(0.35)では正確性優先 |
| **データバインディング** | Trip.path ↔ Zone.id のマッピング → テンプレート定義に沿ったデータ抽出 |
