/**
 * app.js — メインロジック・画面遷移
 */

document.addEventListener('DOMContentLoaded', () => {

  // ===========================
  // 画面遷移
  // ===========================
  const navigate = (screenName) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

    const screen = document.getElementById(`screen-${screenName}`);
    const tab = document.querySelector(`.tab-item[data-screen="${screenName}"]`);
    if (screen) screen.classList.add('active');
    if (tab) tab.classList.add('active');

    // 画面ごとの初期化
    if (screenName === 'search') initSearchScreen();
    if (screenName === 'quiz') Quiz.startQuiz();
    if (screenName === 'folder') renderFolderScreen();
  };

  document.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.screen));
  });

  // ===========================
  // 設定モーダル
  // ===========================
  const openSettings = () => {
    const key = Storage.getApiKey();
    document.getElementById('input-api-key').value = key;
    UI.openModal('modal-settings');
  };

  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-banner-settings').addEventListener('click', openSettings);
  document.getElementById('btn-close-settings').addEventListener('click', () => UI.closeModal('modal-settings'));
  UI.initModalOverlayClose('modal-settings');

  document.getElementById('btn-toggle-api-key').addEventListener('click', () => {
    const input = document.getElementById('input-api-key');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btn-save-api-key').addEventListener('click', () => {
    const key = document.getElementById('input-api-key').value.trim();
    if (!key) { UI.showToast('APIキーを入力してください'); return; }
    Storage.setApiKey(key);
    UI.closeModal('modal-settings');
    UI.showToast('APIキーを保存しました');
    checkApiKey();
  });

  document.getElementById('btn-delete-api-key').addEventListener('click', () => {
    if (!confirm('APIキーを削除しますか？')) return;
    Storage.deleteApiKey();
    document.getElementById('input-api-key').value = '';
    UI.closeModal('modal-settings');
    UI.showToast('APIキーを削除しました');
    checkApiKey();
  });

  // ===========================
  // ヘルプモーダル
  // ===========================
  document.getElementById('btn-help').addEventListener('click', () => UI.openModal('modal-help'));
  document.getElementById('btn-close-help').addEventListener('click', () => UI.closeModal('modal-help'));
  UI.initModalOverlayClose('modal-help');

  // ===========================
  // 講義詳細モーダル
  // ===========================
  document.getElementById('btn-close-lecture').addEventListener('click', () => UI.closeModal('modal-lecture'));
  UI.initModalOverlayClose('modal-lecture');

  const openLectureDetail = (id) => {
    const lecture = Storage.getLectureById(id);
    if (!lecture) return;
    document.getElementById('lecture-detail-title').textContent = lecture.title;
    document.getElementById('lecture-detail-body').innerHTML = UI.buildLectureDetail(lecture);
    UI.openModal('modal-lecture');
  };

  // ===========================
  // API キー確認
  // ===========================
  const checkApiKey = () => {
    const banner = document.getElementById('api-key-banner');
    if (!Storage.getApiKey()) {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  };

  // ===========================
  // ホーム画面
  // ===========================

  // ファイル選択
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  let selectedFile = null;

  dropZone.addEventListener('click', () => {
    if (!selectedFile) fileInput.click();
  });

  // ドラッグ&ドロップ
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) setFile(file);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) setFile(file);
  });

  document.getElementById('btn-clear-file').addEventListener('click', (e) => {
    e.stopPropagation();
    clearFile();
  });

  const setFile = (file) => {
    // バリデーション
    try {
      API.validateFile(file);
    } catch (err) {
      UI.showToast(err.message);
      return;
    }
    selectedFile = file;
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = UI.formatFileSize(file.size);
    document.getElementById('drop-zone-idle').classList.add('hidden');
    document.getElementById('drop-zone-selected').classList.remove('hidden');
    document.getElementById('btn-analyze').classList.remove('btn-inactive');
  };

  const clearFile = () => {
    selectedFile = null;
    fileInput.value = '';
    document.getElementById('drop-zone-idle').classList.remove('hidden');
    document.getElementById('drop-zone-selected').classList.add('hidden');
    document.getElementById('btn-analyze').classList.add('btn-inactive');
  };

  // 分析ボタン
  document.getElementById('btn-analyze').addEventListener('click', () => {
    if (document.getElementById('btn-analyze').classList.contains('btn-inactive')) return;
    runAnalysis();
  });

  // プログレス更新
  let analysisResult = null;

  const setProgress = (text, percent) => {
    document.getElementById('progress-text').textContent = text;
    document.getElementById('progress-bar').style.width = `${percent}%`;
  };

  const showProgress = () => {
    const errEl = document.getElementById('progress-error');
    const runEl = document.getElementById('progress-running');
    if (errEl) errEl.classList.add('hidden');
    if (runEl) runEl.classList.remove('hidden');
    document.getElementById('progress-area').classList.remove('hidden');
    document.getElementById('result-area').classList.add('hidden');
    document.getElementById('btn-analyze').classList.add('btn-inactive');
    document.getElementById('btn-analyze').textContent = '分析中…';
    document.getElementById('progress-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showProgressError = (msg) => {
    const runEl = document.getElementById('progress-running');
    const errEl = document.getElementById('progress-error');
    if (runEl) runEl.classList.add('hidden');
    if (errEl) {
      errEl.textContent = '⚠️ ' + msg;
      errEl.classList.remove('hidden');
    }
    document.getElementById('btn-analyze').classList.remove('btn-inactive');
    document.getElementById('btn-analyze').textContent = '分析する';
  };

  const hideProgress = () => {
    document.getElementById('progress-area').classList.add('hidden');
    document.getElementById('btn-analyze').textContent = '分析する';
  };

  const runAnalysis = async () => {
    if (!selectedFile) { UI.showToast('音声ファイルを選択してください'); return; }
    if (!Storage.getApiKey()) {
      UI.showToast('APIキーを設定してください');
      openSettings();
      return;
    }

    showProgress();

    try {
      // Step 1: 文字起こし
      setProgress('音声を読み込み中…', 10);
      await sleep(300);
      setProgress('文字起こし中…', 20);
      const transcription = await API.transcribeAudio(selectedFile);
      setProgress('文字起こし完了', 50);

      // Step 2: 要約・要点
      setProgress('要約を生成中…', 55);
      const { summary, keyPoints } = await API.summarize(transcription);
      setProgress('要約完了', 75);

      // Step 3: クイズ
      setProgress('クイズを生成中…', 80);
      let quiz = [];
      try {
        quiz = await API.generateQuiz(transcription);
      } catch (e) {
        UI.showToast('クイズの生成に失敗しました（スキップします）');
      }
      setProgress('完了！', 100);

      analysisResult = { transcription, summary, keyPoints, quiz };

      await sleep(400);
      hideProgress();
      renderResults(analysisResult);

    } catch (err) {
      showProgressError(err.message || '予期しないエラーが発生しました');
    }
  };

  // 結果描画
  const renderResults = ({ transcription, summary, keyPoints, quiz }) => {
    // 要約
    document.getElementById('result-summary').textContent = summary;

    // 要点
    const kpList = document.getElementById('result-keypoints');
    kpList.innerHTML = (keyPoints || []).map(p => `<li>${UI.escapeHtml(p)}</li>`).join('');

    // 全文
    document.getElementById('result-transcription').textContent = transcription;

    // クイズ（ホーム用プレビュー：3問まで）
    const quizList = document.getElementById('result-quiz-list');
    const previewQuiz = (quiz || []).slice(0, 3);
    quizList.innerHTML = previewQuiz.map((q, i) => {
      const answerOpt = (q.options || []).find(o => o.startsWith(q.answer + ':')) || q.answer;
      return `
        <div class="quiz-preview-card">
          <p class="quiz-preview-q">Q${i+1}. ${UI.escapeHtml(q.question)}</p>
          <button class="btn-show-answer" data-idx="${i}">答えを表示</button>
          <div class="quiz-preview-answer" id="quiz-ans-${i}">
            <p class="answer-label">正解</p>
            <p class="answer-text">${UI.escapeHtml(answerOpt)}</p>
            <p class="explanation-text">${UI.escapeHtml(q.explanation)}</p>
          </div>
        </div>`;
    }).join('');

    quizList.querySelectorAll('.btn-show-answer').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.idx;
        document.getElementById(`quiz-ans-${idx}`).classList.add('visible');
        btn.style.display = 'none';
      });
    });

    document.getElementById('result-area').classList.remove('hidden');

    // アコーディオン初期化
    UI.initAccordion('toggle-transcription', 'accordion-transcription');

    // コピーボタン
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        let text = '';
        if (target.tagName === 'UL') {
          text = Array.from(target.querySelectorAll('li')).map(li => '• ' + li.textContent).join('\n');
        } else {
          text = target.textContent;
        }
        UI.copyText(text);
      });
    });

    // スクロール
    document.getElementById('result-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 保存ボタン
  document.getElementById('btn-save').addEventListener('click', () => {
    if (!analysisResult) return;

    const titleInput = document.getElementById('input-title').value.trim();
    const tagsRaw = document.getElementById('input-tags').value.trim();
    const now = new Date();

    const title = titleInput ||
      `無題の講義 ${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const tags = tagsRaw
      .split(/\s+/)
      .filter(t => t.startsWith('#') && t.length > 1);

    const lecture = {
      id: Storage.generateId(),
      title,
      tags,
      createdAt: now.toISOString(),
      audioFileName: selectedFile?.name || '',
      transcription: analysisResult.transcription,
      summary: analysisResult.summary,
      keyPoints: analysisResult.keyPoints,
      quiz: analysisResult.quiz || [],
    };

    if (Storage.saveLecture(lecture)) {
      Storage.syncTagsFromLectures();
      UI.showToast('保存しました');
      // リセット
      clearFile();
      document.getElementById('input-title').value = '';
      document.getElementById('input-tags').value = '';
      document.getElementById('result-area').classList.add('hidden');
      analysisResult = null;
    }
  });

  // ===========================
  // 検索画面
  // ===========================
  const initSearchScreen = () => {
    renderSearchHistory();
    document.getElementById('search-results-section').classList.add('hidden');
    document.getElementById('search-empty').classList.add('hidden');
    document.getElementById('search-history-section').classList.remove('hidden');
  };

  const renderSearchHistory = () => {
    const history = Storage.getSearchHistory();
    const list = document.getElementById('search-history-list');
    if (history.length === 0) {
      list.innerHTML = '<li style="color:#999;font-size:13px;padding:8px 0;">検索履歴はありません</li>';
      return;
    }
    list.innerHTML = history.map(h => `
      <li class="search-history-item" data-query="${UI.escapeHtml(h)}">
        <span class="search-history-icon">🕐</span>
        <span>${UI.escapeHtml(h)}</span>
      </li>`).join('');

    list.querySelectorAll('.search-history-item').forEach(item => {
      item.addEventListener('click', () => {
        document.getElementById('search-input').value = item.dataset.query;
        doSearch(item.dataset.query);
      });
    });
  };

  const doSearch = (query) => {
    if (!query.trim()) {
      initSearchScreen();
      return;
    }

    Storage.addSearchHistory(query);
    const lectures = Storage.getLectures();
    const q = query.toLowerCase();

    const results = lectures.filter(l =>
      (l.title || '').toLowerCase().includes(q) ||
      (l.summary || '').toLowerCase().includes(q) ||
      (l.transcription || '').toLowerCase().includes(q) ||
      (l.tags || []).some(t => t.toLowerCase().includes(q))
    );

    document.getElementById('search-history-section').classList.add('hidden');
    document.getElementById('search-empty').classList.add('hidden');

    const resultsSection = document.getElementById('search-results-section');
    const resultsList = document.getElementById('search-results-list');

    if (results.length === 0) {
      resultsSection.classList.add('hidden');
      document.getElementById('search-empty-query').textContent = query;
      document.getElementById('search-empty').classList.remove('hidden');
      return;
    }

    resultsList.innerHTML = results.map(l => UI.buildLectureCard(l)).join('');
    resultsList.querySelectorAll('.lecture-card').forEach(card => {
      card.addEventListener('click', () => openLectureDetail(card.dataset.id));
    });
    resultsSection.classList.remove('hidden');
  };

  const searchInput = document.getElementById('search-input');
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(searchInput.value.trim()), 300);
  });

  document.getElementById('btn-search-cancel').addEventListener('click', () => {
    searchInput.value = '';
    initSearchScreen();
  });

  // ===========================
  // フォルダ画面
  // ===========================
  const renderFolderScreen = () => {
    const lectures = Storage.getLectures();
    const folderDetail = document.getElementById('folder-detail');
    folderDetail.classList.add('hidden');

    // タグ別にグループ化
    const tagMap = new Map();
    tagMap.set('__untagged__', []);

    lectures.forEach(l => {
      if (!l.tags || l.tags.length === 0) {
        tagMap.get('__untagged__').push(l);
      } else {
        l.tags.forEach(tag => {
          if (!tagMap.has(tag)) tagMap.set(tag, []);
          tagMap.get(tag).push(l);
        });
      }
    });

    // タグなし講義を最後に追加
    const untagged = tagMap.get('__untagged__');
    tagMap.delete('__untagged__');
    if (untagged.length > 0) tagMap.set('タグなし', untagged);

    const folderList = document.getElementById('folder-list');
    const folderEmpty = document.getElementById('folder-empty');

    if (tagMap.size === 0) {
      folderList.innerHTML = '';
      folderEmpty.classList.remove('hidden');
      return;
    }

    folderEmpty.classList.add('hidden');
    folderList.innerHTML = Array.from(tagMap.entries()).map(([tag, lecs]) => `
      <div class="folder-card" data-tag="${UI.escapeHtml(tag)}">
        <div class="folder-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        </div>
        <div class="folder-info">
          <div class="folder-name">${UI.escapeHtml(tag)}</div>
          <div class="folder-count">${lecs.length} ファイル</div>
        </div>
        <svg class="folder-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>`).join('');

    folderList.querySelectorAll('.folder-card').forEach(card => {
      card.addEventListener('click', () => {
        const tag = card.dataset.tag;
        openFolder(tag, tagMap.get(tag) || []);
      });
    });
  };

  const openFolder = (tag, lectures) => {
    const detail = document.getElementById('folder-detail');
    document.getElementById('folder-detail-title').textContent = tag;

    const list = document.getElementById('folder-detail-list');
    list.innerHTML = lectures.map(l => UI.buildLectureCard(l)).join('');
    list.querySelectorAll('.lecture-card').forEach(card => {
      card.addEventListener('click', () => openLectureDetail(card.dataset.id));
    });

    detail.classList.remove('hidden');
  };

  document.getElementById('btn-folder-back').addEventListener('click', () => {
    document.getElementById('folder-detail').classList.add('hidden');
  });

  document.getElementById('btn-add-tag').addEventListener('click', () => {
    const tag = prompt('新しいタグ名を入力してください（例: #英語）');
    if (!tag) return;
    const normalized = tag.startsWith('#') ? tag : `#${tag}`;
    Storage.addTag(normalized);
    renderFolderScreen();
    UI.showToast(`タグ「${normalized}」を追加しました`);
  });

  // ===========================
  // セットアップ画面（初回起動）
  // ===========================
  const setupScreen  = document.getElementById('setup-screen');
  const setupKeyInput = document.getElementById('setup-api-key');
  const setupError   = document.getElementById('setup-error');
  const setupLoading = document.getElementById('setup-loading');
  const setupBtn     = document.getElementById('setup-start-btn');

  const showSetup = () => {
    setupScreen.classList.remove('hidden');
    // メインUIを非表示
    document.querySelector('.app-header').style.display = 'none';
    document.querySelector('.main-content').style.display = 'none';
    document.querySelector('.tab-bar').style.display = 'none';
    document.getElementById('btn-help').style.display = 'none';
  };

  const hideSetup = () => {
    setupScreen.classList.add('hidden');
    document.querySelector('.app-header').style.display = '';
    document.querySelector('.main-content').style.display = '';
    document.querySelector('.tab-bar').style.display = '';
    document.getElementById('btn-help').style.display = '';
  };

  document.getElementById('setup-toggle-key').addEventListener('click', () => {
    setupKeyInput.type = setupKeyInput.type === 'password' ? 'text' : 'password';
  });

  setupBtn.addEventListener('click', async () => {
    const key = setupKeyInput.value.trim();
    if (!key) {
      setupError.textContent = '⚠️ APIキーを入力してください';
      setupError.classList.remove('hidden');
      return;
    }
    setupError.classList.add('hidden');
    setupBtn.disabled = true;
    setupLoading.classList.remove('hidden');

    // Gemini API で簡易バリデーション（短いテキスト生成）
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }),
        }
      );
      if (!res.ok) throw new Error('invalid');
      Storage.setApiKey(key);
      setupLoading.classList.add('hidden');
      setupBtn.disabled = false;
      hideSetup();
      checkApiKey();
      UI.showToast('APIキーを設定しました。さっそく使ってみましょう！');
    } catch (e) {
      setupLoading.classList.add('hidden');
      setupBtn.disabled = false;
      setupError.textContent = '⚠️ APIキーが無効です。確認して再度入力してください';
      setupError.classList.remove('hidden');
    }
  });

  // ===========================
  // 初期化
  // ===========================
  const init = () => {
    try {
      Quiz.init();
      if (!Storage.getApiKey()) {
        showSetup();
      } else {
        checkApiKey();
      }
    } catch (e) {
      console.error('init error:', e);
    }
  };

  init();
});

// ユーティリティ
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
