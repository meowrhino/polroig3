// lang.js — toggle binari d'idioma al footer.
// Mostra l'idioma "altre" (al que canviarà al fer click), no l'actual.
// Si hi ha 3+ idiomes el toggle cicla pel següent de la llista.

import { getData } from './data.js';

export function createLangFooter(currentLang, onChange) {
  const data = getData();
  const langs = data.config.idiomas;
  const labels = data.i18n[currentLang]?.idiomas || {};

  // Següent idioma a mostrar = el que vindrà al clicar.
  const idx = langs.indexOf(currentLang);
  const nextLang = langs[(idx + 1) % langs.length];

  const nav = document.createElement('nav');
  nav.className = 'footer';
  nav.setAttribute('aria-label', 'idioma');

  const btn = document.createElement('button');
  btn.className = 'lang__btn';
  btn.dataset.lang = nextLang;
  btn.textContent = labels[nextLang] || nextLang;
  btn.addEventListener('click', () => onChange(nextLang));

  nav.appendChild(btn);
  return nav;
}
