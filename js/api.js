/**
 * api.js — Gemini API 通信
 */

const API = (() => {
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const MIME_MAP = {
    'mp3':  'audio/mp3',
    'wav':  'audio/wav',
    'm4a':  'audio/mp4',
    'webm': 'audio/webm',
    'ogg':  'audio/ogg',
  };

  const getApiKey = () => Storage.getApiKey();

  // ファイル → Base64
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result は "data:audio/mp3;base64,XXXX" 形式なので base64 部分だけ取り出す
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });

  // ファイル形式チェック
  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!MIME_MAP[ext]) {
      throw new Error('対応していないファイル形式です（MP3/WAV/M4A/WEBM/OGGに対応）');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('ファイルサイズが大きすぎます（20MB以下にしてください）');
    }
    return MIME_MAP[ext];
  };

  // Gemini API 呼び出し共通
  const callGemini = async (body) => {
    const key = getApiKey();
    if (!key) throw new Error('APIキーを設定してください');

    const res = await fetch(`${BASE_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 400 || res.status === 403) {
        throw new Error('処理に失敗しました。APIキーを確認してください');
      }
      throw new Error(`通信エラーが発生しました（HTTP ${res.status}）`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('APIからの応答が空でした');
    return text;
  };

  // 1. 音声 → 文字起こし
  const transcribeAudio = async (file) => {
    const mimeType = validateFile(file);
    const base64 = await fileToBase64(file);

    return callGemini({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: 'この音声を日本語で文字起こししてください。全文をそのまま出力してください。音声が聞き取れない部分は「（聞き取れず）」と記載してください。' },
        ],
      }],
    });
  };

  // 2. 文字起こし → 要約・要点
  const summarize = async (transcriptionText) => {
    const prompt = `以下の講義の文字起こしを分析し、以下の形式でJSONのみを出力してください。説明文や\`\`\`は不要です。
{
  "summary": "3行以内の要約（改行で区切る）",
  "keyPoints": ["要点1", "要点2", "要点3"]
}
【文字起こし】
${transcriptionText}`;

    const text = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1000 },
    });

    // JSON 抽出
    const clean = text.replace(/```json|```/g, '').trim();
    try {
      return JSON.parse(clean);
    } catch {
      // 正規表現でオブジェクトを抽出
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('データの解析に失敗しました。再度お試しください');
    }
  };

  // 3. 文字起こし → クイズ生成
  const generateQuiz = async (transcriptionText) => {
    const prompt = `以下は大学講義の文字起こしです。学習者向けの予想問題を5問作成してください。
【重要】JSON配列のみを返してください。説明文や\`\`\`は不要です。
[
  {
    "question": "問題文",
    "options": ["A: 選択肢", "B: 選択肢", "C: 選択肢", "D: 選択肢"],
    "answer": "A",
    "explanation": "解説文（2〜3文）"
  }
]
【文字起こし】
${transcriptionText}`;

    const text = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
    });

    const clean = text.replace(/```json|```/g, '').trim();
    try {
      const parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) throw new Error('配列ではありません');
      return parsed;
    } catch {
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        try { return JSON.parse(match[0]); }
        catch { /* fall through */ }
      }
      throw new Error('問題の生成に失敗しました。再度お試しください');
    }
  };

  return { transcribeAudio, summarize, generateQuiz, validateFile };
})();
