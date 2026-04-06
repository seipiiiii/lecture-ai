# LectureAI 🎙️

講義音声を AI で自動解析するモバイルファースト Web アプリ。

**デモ**: https://seipiiiii.github.io/lecture-ai/

---

## 機能

| 機能 | 説明 |
|---|---|
| 🎙️ 文字起こし | 音声ファイルを Gemini API で全文テキスト化 |
| 📋 3行要約 | 講義内容を3行に凝縮 |
| ✅ 要点抽出 | 重要ポイントをリスト化 |
| 📝 クイズ生成 | 4択問題を5問自動作成 |
| 🔍 全文検索 | 過去の講義を横断検索 |
| 📁 タグ管理 | タグ別フォルダで整理 |

---

## セットアップ

### 1. Gemini API キーを取得

1. [Google AI Studio](https://aistudio.google.com/apikey) にアクセス
2. 「Create API Key」でキーを生成
3. `AIza...` で始まる文字列をコピー

### 2. アプリを開く

https://seipiiiii.github.io/lecture-ai/ をブラウザで開く

> **スマートフォンを推奨**: モバイルファーストで設計されています。

### 3. API キーを設定

初回起動時にセットアップ画面が表示されます。

1. APIキー欄に取得したキーを貼り付け
2. 「始める」をタップ
3. 検証が成功するとメイン画面に移行

> キーは端末の localStorage にのみ保存されます。外部サーバーには送信されません。

---

## 使い方

### 講義を分析する

1. **ホーム**タブを開く
2. タイトル・タグを入力（省略可）
3. 音声ファイルをタップして選択
4. 「分析する」をタップ
5. 完了後、要約・要点・クイズが表示される
6. 「保存する」で保存

### クイズで復習する

1. **クイズ**タブを開く
2. タグで絞り込み（任意）
3. 問題を読んで「答えを表示」→ 選択肢をタップ

### 過去の講義を検索する

1. **検索**タブを開く
2. キーワードを入力（タイトル・要約・本文・タグを横断検索）

---

## 対応ファイル形式

| 形式 | MIME タイプ |
|---|---|
| MP3 | audio/mp3 |
| WAV | audio/wav |
| M4A | audio/mp4 |
| MP4 | audio/mp4 |
| WebM | audio/webm |
| OGG | audio/ogg |

**最大ファイルサイズ**: 20 MB
**推奨**: まず 30秒〜2分の短い音声でお試しください

---

## 注意事項

- 個人情報・機密性の高い音声はアップロードしないでください
- Gemini API 無料プランはレート制限があります。429 エラーが出た場合は 1〜2分待ってから再試行してください
- データはすべて端末に保存されます。ブラウザのデータを削除すると消えます
- API キーを GitHub の公開リポジトリにコミットしないでください

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| フロントエンド | HTML / CSS / JavaScript（フレームワークなし） |
| AI API | Google Gemini API（`gemini-2.5-flash`） |
| ストレージ | localStorage |
| デプロイ | GitHub Pages |

---

## ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/seipiiiii/lecture-ai.git
cd lecture-ai

# 静的ファイルサーバーで起動（例: Python）
python -m http.server 8080

# ブラウザで開く
open http://localhost:8080
```

---

## GitHub Pages デプロイ手順

1. リポジトリを GitHub にプッシュ
2. Settings → Pages → Source: Deploy from a branch → `main` / `root`
3. 公開された URL にアクセス

---

## ドキュメント

| ファイル | 内容 |
|---|---|
| [docs/SPEC.md](docs/SPEC.md) | 詳細仕様 |
| [docs/API_NOTES.md](docs/API_NOTES.md) | Gemini API 利用メモ |
| [docs/TESTCASES.md](docs/TESTCASES.md) | テスト手順・期待結果 |
| [docs/STATUS.md](docs/STATUS.md) | 現在の状態・課題記録 |
| [docs/PROMPTS.md](docs/PROMPTS.md) | AI プロンプト設計 |
