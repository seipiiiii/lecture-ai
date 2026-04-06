# API Notes — Gemini API 利用メモ

## 公式リソース

| リソース | URL |
|---|---|
| モデル一覧 | https://ai.google.dev/gemini-api/docs/models |
| APIリファレンス | https://ai.google.dev/api |
| Google AI Studio | https://aistudio.google.com/apikey |
| 料金・制限 | https://ai.google.dev/gemini-api/docs/rate-limits |

---

## 使用モデル

| 用途 | モデル ID | 理由 |
|---|---|---|
| 分析（文字起こし・要約・クイズ） | `gemini-2.5-flash` | 高精度・音声対応・コスト効率 |
| APIキー検証のみ | `gemini-2.0-flash` | 安定版。2.5 Flash はプレビュー期間中に利用不可となる場合があるため |

---

## エンドポイント

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
```

### 文字起こしリクエスト例

```json
{
  "contents": [{
    "parts": [
      {
        "inline_data": {
          "mime_type": "audio/mp4",
          "data": "<base64エンコードされた音声データ>"
        }
      },
      {
        "text": "この音声を日本語で文字起こししてください。"
      }
    ]
  }]
}
```

### 要約リクエスト例

```json
{
  "contents": [{ "parts": [{ "text": "..." }] }],
  "generationConfig": {
    "temperature": 0.4,
    "maxOutputTokens": 1000
  }
}
```

---

## レート制限（無料プラン）

| モデル | RPM（リクエスト/分） | TPM（トークン/分） |
|---|---|---|
| gemini-2.0-flash | 15 | 1,000,000 |
| gemini-2.5-flash | 10（目安） | 制限あり |

> **注意**: 無料プランでは分析中に 429 (Too Many Requests) が返る場合がある。
> 1〜2分待ってから再試行すること。

---

## HTTP ステータスコードの扱い

| コード | 意味 | アプリの挙動 |
|---|---|---|
| 200 | 成功 | 正常処理 |
| 400 | 不正リクエスト | 「APIキーを確認してください」エラー |
| 401/403 | 認証エラー | 「APIキーを確認してください」エラー |
| 404 | モデルが存在しない | 通信エラー表示 |
| 429 | レート制限 | APIキー検証時は「有効」として扱う。分析時はエラー表示 |
| 5xx | サーバーエラー | 通信エラー表示 |

---

## 音声データの送信方法

現在は **inline_data（Base64埋め込み）** を使用。

```
FileReader.readAsDataURL(file)
  → "data:audio/mp4;base64,XXXX..."
  → split(',')[1] で Base64 部分のみ取り出し
  → inline_data.data に設定
```

> **制限**: inline_data はリクエストボディに含まれるため、実質的な上限は約 20MB（Base64 変換後は約 33% 増加）。

---

## プロンプト設計

### 要約プロンプト

```
以下の講義の文字起こしを分析し、以下の形式でJSONのみを出力してください。
{
  "summary": "3行以内の要約",
  "keyPoints": ["要点1", "要点2", "要点3"]
}
```

### クイズ生成プロンプト

```
以下は大学講義の文字起こしです。学習者向けの予想問題を5問作成してください。
JSON配列のみを返してください。
[
  {
    "question": "問題文",
    "options": ["A: ...", "B: ...", "C: ...", "D: ..."],
    "answer": "A",
    "explanation": "解説文（2〜3文）"
  }
]
```

---

## 既知の問題

- `gemini-2.5-flash-preview-04-17`（2025年4月プレビュー版）は2026年時点で廃止済み → `gemini-2.5-flash` を使用すること
- 無料プランの 429 エラーは一時的なもの。課金設定で緩和可能
