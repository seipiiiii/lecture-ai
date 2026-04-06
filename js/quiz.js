/**
 * quiz.js — クイズ機能
 */

const Quiz = (() => {
  let state = {
    questions: [],
    currentIndex: 0,
    selected: null,
    isAnswered: false,
    score: 0,
    isComplete: false,
    activeTag: 'all',
  };

  const resetState = (questions) => {
    state = {
      questions,
      currentIndex: 0,
      selected: null,
      isAnswered: false,
      score: 0,
      isComplete: false,
      activeTag: state.activeTag,
    };
  };

  // タグフィルターを描画
  const renderTagFilter = () => {
    const lectures = Storage.getLectures();
    const tagSet = new Set(['all']);
    lectures.forEach(l => (l.tags || []).forEach(t => tagSet.add(t)));

    const container = document.getElementById('quiz-tag-filter');
    container.innerHTML = Array.from(tagSet).map(tag => {
      const label = tag === 'all' ? 'すべて' : tag;
      const active = state.activeTag === tag ? 'active' : '';
      return `<button class="tag-chip ${active}" data-tag="${UI.escapeHtml(tag)}">${UI.escapeHtml(label)}</button>`;
    }).join('');

    container.querySelectorAll('.tag-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeTag = btn.dataset.tag;
        startQuiz();
      });
    });
  };

  // クイズを開始（タグでフィルタ、シャッフル、5問）
  const startQuiz = () => {
    renderTagFilter();

    const lectures = Storage.getLectures();
    let allQuestions = [];

    lectures.forEach(lecture => {
      if (!lecture.quiz || lecture.quiz.length === 0) return;
      const matchTag = state.activeTag === 'all' ||
        (lecture.tags || []).includes(state.activeTag);
      if (matchTag) {
        lecture.quiz.forEach(q => {
          allQuestions.push({
            ...q,
            category: lecture.tags?.[0] || lecture.title || '無題',
          });
        });
      }
    });

    const quizEmpty = document.getElementById('quiz-empty');
    const quizQWrap = document.getElementById('quiz-question-wrap');
    const quizRWrap = document.getElementById('quiz-result-wrap');

    if (allQuestions.length === 0) {
      quizEmpty.classList.remove('hidden');
      quizQWrap.classList.add('hidden');
      quizRWrap.classList.add('hidden');
      return;
    }

    // シャッフルして最大5問
    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 5);
    resetState(shuffled);

    quizEmpty.classList.add('hidden');
    quizRWrap.classList.add('hidden');
    quizQWrap.classList.remove('hidden');

    renderQuestion();
  };

  // 問題を描画
  const renderQuestion = () => {
    if (state.currentIndex >= state.questions.length) {
      showResult();
      return;
    }

    const q = state.questions[state.currentIndex];
    document.getElementById('quiz-category').textContent = q.category || '';
    document.getElementById('quiz-progress').textContent =
      `${state.currentIndex + 1} / ${state.questions.length}`;
    document.getElementById('quiz-num').textContent = state.currentIndex + 1;
    document.getElementById('quiz-question').textContent = q.question;

    // 選択肢を準備（非表示）
    const optionsList = document.getElementById('quiz-options');
    optionsList.classList.add('hidden');
    optionsList.innerHTML = (q.options || []).map((opt, i) => {
      const letter = ['A','B','C','D'][i];
      return `<li class="quiz-option" data-letter="${letter}">${UI.escapeHtml(opt)}</li>`;
    }).join('');

    optionsList.querySelectorAll('.quiz-option').forEach(el => {
      el.addEventListener('click', () => onOptionClick(el, q));
    });

    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('btn-quiz-next').classList.add('hidden');
    document.getElementById('btn-show-answer').classList.remove('hidden');
    state.isAnswered = false;
    state.selected = null;
  };

  // 「答えを表示」クリック → 選択肢を表示
  const onShowAnswer = () => {
    const optionsList = document.getElementById('quiz-options');
    optionsList.classList.remove('hidden');
    document.getElementById('btn-show-answer').classList.add('hidden');
  };

  const onOptionClick = (el, q) => {
    if (state.isAnswered) return;

    state.isAnswered = true;
    state.selected = el.dataset.letter;
    const isCorrect = state.selected === q.answer;
    if (isCorrect) state.score++;

    // 選択肢の色付け
    document.querySelectorAll('.quiz-option').forEach(opt => {
      opt.classList.add('answered');
      if (opt.dataset.letter === q.answer) {
        opt.classList.add('correct');
      } else if (opt.dataset.letter === state.selected && !isCorrect) {
        opt.classList.add('incorrect');
      }
    });

    // フィードバック
    const feedback = document.getElementById('quiz-feedback');
    const explanation = document.getElementById('quiz-explanation');
    explanation.textContent = (isCorrect ? '✅ 正解！ ' : '❌ 不正解。') + (q.explanation || '');
    feedback.classList.remove('hidden');

    document.getElementById('btn-quiz-next').classList.remove('hidden');
  };

  // 次の問題
  const nextQuestion = () => {
    state.currentIndex++;
    if (state.currentIndex >= state.questions.length) {
      showResult();
    } else {
      renderQuestion();
    }
  };

  // 結果画面
  const showResult = () => {
    state.isComplete = true;
    document.getElementById('quiz-question-wrap').classList.add('hidden');
    const resultWrap = document.getElementById('quiz-result-wrap');
    resultWrap.classList.remove('hidden');

    const total = state.questions.length;
    const score = state.score;
    document.getElementById('quiz-score-value').textContent = `${score} / ${total} 問正解`;

    let msg = '';
    const ratio = score / total;
    if (ratio === 1) msg = '完璧です！素晴らしい！🎉';
    else if (ratio >= 0.8) msg = 'よくできました！もう少しで満点！';
    else if (ratio >= 0.6) msg = 'まずまずです。苦手な部分を復習しましょう。';
    else msg = '復習が必要です。もう一度チャレンジしてみましょう！';
    document.getElementById('quiz-score-msg').textContent = msg;
  };

  const init = () => {
    document.getElementById('btn-quiz-next')?.addEventListener('click', nextQuestion);
    document.getElementById('btn-quiz-retry')?.addEventListener('click', startQuiz);
    document.getElementById('btn-show-answer')?.addEventListener('click', onShowAnswer);
  };

  return { init, startQuiz, renderTagFilter };
})();
