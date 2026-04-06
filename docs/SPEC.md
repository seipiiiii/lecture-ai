# LectureAI — 仕様書

## 概要

講義音声ファイルをアップロードし、Google Gemini API を用いて文字起こし・要約・クイズを自動生成するモバイルファースト SPA。

- **形態**: シングルページアプリケーション（SPA）／静的ファイル
- **デプロイ**: GitHub Pages
- **バックエンド**: なし（API キーはクライアントの localStorage に保存）

---

## 画面構成（4タブ）

| タブ | ID | 機能 |
|---|---|---|
| ホーム | `screen-home` | 音声アップロード・分析・結果表示 |
| 検索 | `screen-search` | 過去講義の全文検索 |
| クイズ | `screen-quiz` | タグ絞り込み付きクイズモード |
| フォルダ | `screen-folder` | タグ別フォルダ一覧 |

### 初回起動フロー

1. `localStorage` に API キーがなければ `#setup-screen` を表示
2. Gemini API で簡易バリデーション（`gemini-2.0-flash` に "hi" を送信）
3. 成功（200 or 429）→ キーを保存してメイン画面へ
4. 失敗（401/403/400）→ エラーメッセージ表示

---

## 分析フロー（ホーム画面）

```
音声ファイル選択
  → Base64 エンコード（FileReader.readAsDataURL）
  → Step 1: 文字起こし（inline_data でGemini に送信）
  → Step 2: 要約・要点（テキストをGemini に送信、JSON レスポンス）
  → Step 3: クイズ生成（テキストをGemini に送信、JSON 配列レスポンス）
  → 結果表示 → 保存（localStorage）
```

---

## データモデル（localStorage）

| キー | 型 | 内容 |
|---|---|---|
| `lectureai_api_key` | `string` | Gemini API キー（平文） |
| `lectureai_lectures` | `JSON` | 講義オブジェクト配列 |
| `lectureai_search_history` | `JSON` | 検索履歴（最大10件） |
| `lectureai_tags` | `JSON` | タグ文字列配列 |

### 講義オブジェクト

```json
{
  "id": "lecture_20250601_123456",
  "title": "経済学 #5",
  "tags": ["#月2", "#試験"],
  "createdAt": "2025-06-01T12:34:56.000Z",
  "audioFileName": "lecture.m4a",
  "transcription": "全文テキスト...",
  "summary": "3行要約...",
  "keyPoints": ["要点1", "要点2"],
  "quiz": [
    {
      "question": "問題文",
      "options": ["A: ...", "B: ...", "C: ...", "D: ..."],
      "answer": "A",
      "explanation": "解説..."
    }
  ]
}
```

---

## ファイル構成

```
LectureAI/
├── index.html          # SPA 本体（全画面・モーダル含む）
├── css/
│   └── style.css       # モバイルファースト CSS（375px 基準、max 480px）
├── js/
│   ├── storage.js      # localStorage 操作
│   ├── ui.js           # トースト・モーダル・共通 UI ヘルパー
│   ├── api.js          # Gemini API 通信
│   ├── quiz.js         # クイズロジック
│   └── app.js          # メインロジック・画面遷移
├── docs/               # ドキュメント類
└── screenshots/        # 動作証跡画像
```

---

## 対応ファイル形式

| 拡張子 | MIME タイプ |
|---|---|
| .mp3 | audio/mp3 |
| .wav | audio/wav |
| .m4a | audio/mp4 |
| .mp4 | audio/mp4 |
| .webm | audio/webm |
| .ogg | audio/ogg |

最大ファイルサイズ: **20 MB**

---

## レイアウト仕様

- ベース幅: 375px（iPhone SE 基準）
- 最大幅: 480px（中央寄せ）
- 固定要素は `position: fixed; left: 50%; transform: translateX(-50%)` で中央寄せ
- `fadeIn` アニメーションは `opacity` のみ（transform との競合を避けるため）

---

## セキュリティ方針

- API キーはクライアントの localStorage にのみ保存
- サーバーへの送信なし（音声データは Gemini API にのみ送信）
- 個人情報・機密音声のアップロード非推奨
