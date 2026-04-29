// lang.js — selector de idioma (footer). Genera <nav class="footer">
// con un botón por idioma. Click cambia el hash a la misma vista pero
// con el idioma nuevo.

import { getData } from './data.js';

export function createLangFooter(currentLang, onChange) {
  const data = getData();
  const langs = data.config.idiomas;
  const labels = data.i18n[currentLang]?.idiomas || {};

  const nav = document.createElement('nav');
  nav.className = 'footer';
  nav.setAttribute('aria-label', 'idiomes');

  langs.forEach((lang, idx) => {
    const btn = document.createElement('button');
    btn.className = 'lang__btn' + (lang === currentLang ? ' is-active' : '');
    btn.dataset.lang = lang;
    btn.textContent = labels[lang] || lang.toUpperCase();
    btn.addEventListener('click', () => onChange(lang));
    nav.appendChild(btn);
    if (idx < langs.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'lang__sep';
      sep.textContent = '·';
      nav.appendChild(sep);
    }
  });

  return nav;
}
