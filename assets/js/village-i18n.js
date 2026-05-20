/* village-i18n.js — simple FR/EN switcher
   Elements with data-fr / data-en attrs get their textContent swapped.
   Elements with data-fr-html / data-en-html get innerHTML swapped.
   Language persists via localStorage. */

(function () {
  var STORAGE_KEY = 'village-lang';
  var currentLang = localStorage.getItem(STORAGE_KEY) || 'fr';

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'fr';

    // Text swaps
    document.querySelectorAll('[data-fr]').forEach(function (el) {
      el.textContent = lang === 'en' ? (el.dataset.en || el.dataset.fr) : el.dataset.fr;
    });
    // HTML swaps
    document.querySelectorAll('[data-fr-html]').forEach(function (el) {
      el.innerHTML = lang === 'en' ? (el.dataset.enHtml || el.dataset.frHtml) : el.dataset.frHtml;
    });
    // Placeholder swaps
    document.querySelectorAll('[data-fr-placeholder]').forEach(function (el) {
      el.placeholder = lang === 'en' ? (el.dataset.enPlaceholder || el.dataset.frPlaceholder) : el.dataset.frPlaceholder;
    });
    // Sync all switcher buttons on this page
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function initSwitchers() {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
    });
    applyLang(currentLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitchers);
  } else {
    initSwitchers();
  }
})();
