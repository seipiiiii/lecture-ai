/**
 * storage.js — localStorage 操作
 */

const Storage = (() => {
  const KEYS = {
    API_KEY:        'lectureai_api_key',
    LECTURES:       'lectureai_lectures',
    SEARCH_HISTORY: 'lectureai_search_history',
    TAGS:           'lectureai_tags',
  };

  const _get = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };

  const _set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        UI.showToast('ストレージ容量が不足しています。不要なデータを削除してください');
      }
      return false;
    }
  };

  // --- API Key ---
  const getApiKey = () => localStorage.getItem(KEYS.API_KEY) || '';
  const setApiKey = (key) => localStorage.setItem(KEYS.API_KEY, key);
  const deleteApiKey = () => localStorage.removeItem(KEYS.API_KEY);

  // --- Lectures ---
  const getLectures = () => _get(KEYS.LECTURES, []);

  const saveLecture = (lecture) => {
    const lectures = getLectures();
    const idx = lectures.findIndex(l => l.id === lecture.id);
    if (idx >= 0) {
      lectures[idx] = lecture;
    } else {
      lectures.unshift(lecture);
    }
    return _set(KEYS.LECTURES, lectures);
  };

  const deleteLecture = (id) => {
    const lectures = getLectures().filter(l => l.id !== id);
    return _set(KEYS.LECTURES, lectures);
  };

  const getLectureById = (id) => getLectures().find(l => l.id === id) || null;

  // --- Search History ---
  const getSearchHistory = () => _get(KEYS.SEARCH_HISTORY, []);

  const addSearchHistory = (query) => {
    if (!query.trim()) return;
    let history = getSearchHistory().filter(h => h !== query);
    history.unshift(query);
    if (history.length > 10) history = history.slice(0, 10);
    _set(KEYS.SEARCH_HISTORY, history);
  };

  const clearSearchHistory = () => _set(KEYS.SEARCH_HISTORY, []);

  // --- Tags ---
  const getTags = () => _get(KEYS.TAGS, []);

  const saveTags = (tags) => _set(KEYS.TAGS, tags);

  const addTag = (tag) => {
    if (!tag.trim()) return;
    const tags = getTags();
    if (!tags.includes(tag)) {
      tags.push(tag);
      _set(KEYS.TAGS, tags);
    }
  };

  const syncTagsFromLectures = () => {
    const lectures = getLectures();
    const tagSet = new Set();
    lectures.forEach(l => (l.tags || []).forEach(t => tagSet.add(t)));
    _set(KEYS.TAGS, Array.from(tagSet));
  };

  // --- Generate ID ---
  const generateId = () => {
    const now = new Date();
    const pad = (n, len = 2) => String(n).padStart(len, '0');
    return `lecture_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  };

  return {
    getApiKey, setApiKey, deleteApiKey,
    getLectures, saveLecture, deleteLecture, getLectureById,
    getSearchHistory, addSearchHistory, clearSearchHistory,
    getTags, saveTags, addTag, syncTagsFromLectures,
    generateId,
  };
})();
