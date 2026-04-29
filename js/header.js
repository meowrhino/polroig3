// header.js — capçalera única per a totes les vistes.
// Mostra el títol braille al centre i, opcionalment, un enllaç "← tornar"
// alineat a l'esquerra (només a la pàgina de projecte).

import { getData, t } from './data.js';
import { toBrailleHTML } from './braille.js';

export function createHeader({ back } = {}) {
  const data = getData();
  const header = document.createElement('header');
  header.className = 'header';

  if (back) {
    const link = document.createElement('a');
    link.className = 'header__volver';
    link.href = back.href;
    link.textContent = `← ${t('volver', back.lang) || 'volver'}`;
    if (typeof back.onClick === 'function') {
      link.addEventListener('click', (ev) => {
        ev.preventDefault();
        back.onClick();
      });
    }
    header.appendChild(link);
  }

  const braille = document.createElement('h1');
  braille.className = 'braille';
  braille.setAttribute('aria-label', data.config.titulo_braille);
  braille.innerHTML = toBrailleHTML(data.config.titulo_braille);
  header.appendChild(braille);

  return header;
}
