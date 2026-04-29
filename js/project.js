// project.js — render de la página de un proyecto. Recorre los grupos
// y monta los sub-bloques presentes (slideshow, título, texto, texto_desplegable).

import { pickLang, findProject, imgPath, t, setFavicon } from './data.js';
import { createHeader } from './header.js';
import { createSlideshow } from './slideshow.js';
import { createDesplegable } from './desplegable.js';
import { createLangFooter } from './lang.js';

export function renderProject({ root, slug, lang, onBack, onChangeLang }) {
  const project = findProject(slug);
  if (!project) {
    onBack();
    return;
  }

  root.innerHTML = '';
  setFavicon(slug);

  // Header amb "← tornar" + braille (compartit amb la home via header.js)
  root.appendChild(createHeader({
    back: { href: `#/${slug}/${lang}`, lang, onClick: onBack },
  }));

  // Main
  const main = document.createElement('main');
  main.className = 'project';
  const inner = document.createElement('div');
  inner.className = 'project__inner';

  for (const grupo of (project.grupos || [])) {
    const groupEl = renderGrupo(grupo, slug, lang);
    if (groupEl) inner.appendChild(groupEl);
  }

  main.appendChild(inner);
  root.appendChild(main);

  // Footer idiomas
  const footer = createLangFooter(lang, (newLang) => onChangeLang(newLang));
  root.appendChild(footer);
}

function renderGrupo(grupo, slug, lang) {
  // Si el grupo está vacío de todo, no renderizamos nada.
  const hasSlideshow   = Array.isArray(grupo.slideshow) && grupo.slideshow.length > 0;
  const hasTitulo      = !!grupo.titulo;
  const hasTexto       = Array.isArray(grupo.texto) && grupo.texto.length > 0;
  const hasDesplegable = Array.isArray(grupo.texto_desplegable) && grupo.texto_desplegable.length > 0;
  if (!hasSlideshow && !hasTitulo && !hasTexto && !hasDesplegable) return null;

  const section = document.createElement('section');
  section.className = 'grupo';

  if (hasSlideshow) {
    const urls = grupo.slideshow.map(name => imgPath(slug, name));
    section.appendChild(createSlideshow(urls));
  }

  if (hasTitulo) {
    const h2 = document.createElement('h2');
    h2.className = 'grupo__titulo';
    h2.textContent = pickLang(grupo.titulo, lang);
    section.appendChild(h2);
  }

  if (hasTexto) {
    for (const para of grupo.texto) {
      const p = document.createElement('p');
      p.className = 'grupo__parrafo';
      p.textContent = pickLang(para, lang);
      section.appendChild(p);
    }
  }

  if (hasDesplegable) {
    const parrafos = grupo.texto_desplegable.map(p => pickLang(p, lang));
    const txtMas   = t('leer_mas',   lang) || 'leer más';
    const txtMenos = t('leer_menos', lang) || 'cerrar';
    section.appendChild(createDesplegable(parrafos, txtMas, txtMenos));
  }

  return section;
}
