/**
 * ui.js — UI ヘルパー（トースト・モーダル・共通パーツ）
 */

const UI = (() => {
  let toastTimer = null;

  // --- Toast ---
  const showToast = (msg) => {
    const el = document.getElementById('toast');
    if (toastTimer) clearTimeout(toastTimer);
    el.textContent = msg;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    // Force reflow
    void el.offsetWidth;
    el.style.animation = '';
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
  };

  // --- Modal ---
  const openModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  };

  const closeModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  };

  // Close modal on overlay click
  const initModalOverlayClose = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', (e) => {
      if (e.target === el) closeModal(id);
    });
  };

  // --- Accordion ---
  const initAccordion = (toggleId, contentId) => {
    const toggle = document.getElementById(toggleId);
    const content = document.getElementById(contentId);
    if (!toggle || !content) return;

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.querySelector('span').textContent = isOpen ? '全文を表示する' : '全文を閉じる';
      content.classList.toggle('hidden', isOpen);
    });
  };

  // --- Format date ---
  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  // --- Format file size ---
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // --- Copy to clipboard ---
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('コピーしました');
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('コピーしました');
    }
  };

  // --- Build lecture card HTML ---
  const buildLectureCard = (lecture) => {
    const tagsHtml = (lecture.tags || [])
      .map(t => `<span class="tag-chip-sm">${escapeHtml(t)}</span>`)
      .join('');
    return `
      <div class="lecture-card" data-id="${lecture.id}">
        <div class="lecture-card-title">${escapeHtml(lecture.title)}</div>
        <div class="lecture-card-meta">${formatDate(lecture.createdAt)}</div>
        <div class="lecture-card-summary">${escapeHtml(lecture.summary || '')}</div>
        ${tagsHtml ? `<div class="lecture-tags">${tagsHtml}</div>` : ''}
      </div>`;
  };

  // --- Escape HTML ---
  const escapeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // --- Build lecture detail modal body ---
  const buildLectureDetail = (lecture) => {
    const tagsHtml = (lecture.tags || [])
      .map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`)
      .join('');

    const keypointsHtml = (lecture.keyPoints || [])
      .map(p => `<li>${escapeHtml(p)}</li>`)
      .join('');

    const quizHtml = (lecture.quiz || []).map((q, i) => {
      const answerOption = (q.options || []).find(o => o.startsWith(q.answer + ':')) || q.answer;
      return `
        <div class="detail-quiz-item">
          <div class="detail-quiz-q">Q${i+1}. ${escapeHtml(q.question)}</div>
          <div class="detail-quiz-ans">正解: ${escapeHtml(answerOption)}</div>
          <div class="explanation-text">${escapeHtml(q.explanation)}</div>
        </div>`;
    }).join('');

    return `
      <div class="detail-date">${formatDate(lecture.createdAt)}</div>
      ${tagsHtml ? `<div class="detail-tags">${tagsHtml}</div>` : ''}

      <div class="detail-section">
        <div class="detail-section-title">📋 3行要約</div>
        <div class="card"><p class="result-text">${escapeHtml(lecture.summary)}</p></div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">✅ 要点</div>
        <div class="card"><ul class="keypoints-list">${keypointsHtml}</ul></div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">📄 全文文字起こし</div>
        <div class="card"><p class="result-text transcription-text">${escapeHtml(lecture.transcription)}</p></div>
      </div>

      ${quizHtml ? `
      <div class="detail-section">
        <div class="detail-section-title">📝 クイズ</div>
        ${quizHtml}
      </div>` : ''}
    `;
  };

  return {
    showToast, openModal, closeModal, initModalOverlayClose,
    initAccordion, formatDate, formatFileSize, copyText,
    buildLectureCard, buildLectureDetail, escapeHtml,
  };
})();
