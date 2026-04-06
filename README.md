# LectureAI

講義音声を AI で自動解析する スマートフォン対応 Web アプリ。

## 機能

- 🎙️ 音声ファイルの文字起こし（Gemini API）
- 📋 3行要約・要点抽出
- 📝 復習クイズ自動生成（4択 × 5問）
- 🔍 過去の講義全文検索
- 📁 タグ別フォルダ管理

## セットアップ

1. [Google AI Studio](https://ai.google.dev/) で Gemini API キーを取得
2. `index.html` をブラウザで開く（または GitHub Pages で公開）
3. 右上のユーザーアイコン → API キーを入力して保存

## 対応ファイル形式

MP3 / WAV / M4A / WEBM / OGG（最大 20MB）

## データ保存

すべてのデータは端末の localStorage に保存されます。サーバーへの送信はありません（音声データは Gemini API にのみ送信されます）。

## 注意事項

- 個人情報・機密性の高い音声はアップロードしないでください
- API キーを GitHub の公開リポジトリにコミットしないでください
- 初回は 30秒〜2分程度の短い音声でテストしてください

## GitHub Pages でのデプロイ

1. リポジトリを GitHub にプッシュ
2. Settings → Pages → Source: Deploy from a branch → `main` / `root`
3. 公開された URL にアクセス
