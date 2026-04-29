// home.js — monta la vista de home: header braille + rueda + mirilla + preview + footer.
// Se llama desde app.js con el slug seleccionado y el idioma activo.

import { getData, pickLang, mirillaPath, t, indexOfProject, setFavicon } from './data.js';
import { createHeader } from './header.js';
import { createWheel } from './wheel.js';
import { swapMirilla } from './mirilla.js';
import { createLangFooter } from './lang.js';
import { Iris } from './iris.js';

const SELECTOR_SLOT = 3;

export function renderHome({ root, slug, lang, onNavigateProject, onChangeLang }) {
  const data = getData();
  const projects = data.proyectos;
  const N = projects.length;

  // Resolver índice activo. Si el slug pedido no existe, fallback a SELECTOR_SLOT
  // (proyecto que toca al selector con la rueda sin rotar).
  let activeIdx = indexOfProject(slug);
  if (activeIdx < 0) activeIdx = Math.min(SELECTOR_SLOT, N - 1);
  const activeProject = projects[activeIdx];

  // ----- DOM -----
  root.innerHTML = '';
  const home = document.createElement('div');
  home.className = 'home';

  // Header (sense "← tornar" a la home)
  home.appendChild(createHeader());

  // Wheel stage — l'stage és el contenidor que decideix on va el disc;
  // el disc agrupa roda + mirilla + selector i ocupa exactament wheel-size,
  // així es desplacen junts cap a l'esquerra sense desalinear-se.
  const stage = document.createElement('div');
  stage.className = 'wheel-stage';

  const disc = document.createElement('div');
  disc.className = 'wheel-disc';

  const wheelEl = document.createElement('div');
  wheelEl.className = 'wheel';

  // Items (uno por slot 0..N-1 — los slots N..11 quedan vacíos).
  // Estructura: <div .wheel__slot style="--i:K"><button .wheel__item>…</button></div>
  // El slot ancla la posición radial; el item-button se centra sobre él
  // y rota 90º para que el texto salga como un rayo de sol.
  projects.forEach((p, i) => {
    const slot = document.createElement('div');
    slot.className = 'wheel__slot';
    slot.style.setProperty('--i', i);

    const item = document.createElement('button');
    item.className = 'wheel__item' + (i === activeIdx ? ' is-active' : '');
    item.dataset.index = String(i);
    item.dataset.slug  = p.slug;
    item.textContent = pickLang(p.nombre, lang);

    slot.appendChild(item);
    wheelEl.appendChild(slot);
  });

  disc.appendChild(wheelEl);

  // Selector triangular
  const sel = document.createElement('div');
  sel.className = 'wheel__selector';
  disc.appendChild(sel);

  // Mirilla central (es un <a> que navega al proyecto)
  const mirilla = document.createElement('a');
  mirilla.className = 'mirilla';
  mirilla.id = 'mirilla';
  mirilla.href = `#/proyecto/${activeProject.slug}/${lang}`;
  mirilla.setAttribute('aria-label', pickLang(activeProject.nombre, lang));
  const mirillaImg = document.createElement('img');
  mirillaImg.className = 'mirilla__img';
  mirillaImg.alt = '';
  mirillaImg.addEventListener('error', () => mirillaImg.removeAttribute('src'));
  mirillaImg.src = mirillaPath(activeProject.slug);
  mirilla.appendChild(mirillaImg);

  const mirillaIris = document.createElement('div');
  mirillaIris.className = 'mirilla__iris';
  mirilla.appendChild(mirillaIris);

  disc.appendChild(mirilla);
  stage.appendChild(disc);

  home.appendChild(stage);

  // Preview de texto
  const preview = document.createElement('div');
  preview.className = 'preview';
  const previewInner = document.createElement('div');
  previewInner.className = 'preview__inner';
  preview.appendChild(previewInner);
  home.appendChild(preview);

  // Footer (idiomas)
  const footer = createLangFooter(lang, (newLang) => onChangeLang(newLang));
  home.appendChild(footer);

  root.appendChild(home);

  // ----- Lógica de preview (texto truncado + "ver más") -----
  function updatePreview(project, animate = true) {
    const firstParas = project.grupos?.[0]?.texto;
    const firstPara  = firstParas?.[0];
    const text = firstPara ? pickLang(firstPara, lang) : '';
    const verMas = t('ver_mas', lang) || 'ver más';

    const html = text
      ? `<span class="preview__text">${escapeHtml(text)}</span>
         <a class="preview__more" href="#/proyecto/${project.slug}/${lang}">… ${escapeHtml(verMas)}</a>`
      : `<a class="preview__more" href="#/proyecto/${project.slug}/${lang}">${escapeHtml(verMas)}</a>`;

    if (!animate) {
      previewInner.innerHTML = html;
      bindPreviewLink();
      return;
    }
    preview.classList.add('is-fading');
    setTimeout(() => {
      previewInner.innerHTML = html;
      bindPreviewLink();
      preview.classList.remove('is-fading');
    }, 250);
  }

  function bindPreviewLink() {
    const a = previewInner.querySelector('.preview__more');
    if (a) a.addEventListener('click', (ev) => {
      ev.preventDefault();
      enterProject(a.getAttribute('href'));
    });
  }

  // ----- Click en mirilla → entrar al proyecto -----
  mirilla.addEventListener('click', (ev) => {
    ev.preventDefault();
    enterProject(mirilla.getAttribute('href'));
  });

  async function enterProject(href) {
    if (Iris.isBusy()) return;
    const rect = mirilla.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    await Iris.cover(cx, cy);
    onNavigateProject(href);
    // El reveal lo dispara project.js cuando la página esté montada.
  }

  // ----- Wheel -----
  // Dos esdeveniments separats:
  //   onPreview — disparat en cada slot mentre arrossegues. Toca només
  //     la mirilla i el favicon (canvi visual ràpid en viu).
  //   onSettle — disparat al fi del snap. Aleshores canvia el text del
  //     preview (amb fade) i actualitza la URL.
  createWheel({
    stageEl: stage,
    wheelEl,
    projects,
    initialIndex: activeIdx,
    onPreview: (project, idx) => {
      activeIdx = idx;
      swapMirilla(mirilla, mirillaPath(project.slug), true);
      mirilla.href = `#/proyecto/${project.slug}/${lang}`;
      mirilla.setAttribute('aria-label', pickLang(project.nombre, lang));
      setFavicon(project.slug);
    },
    onSettle: (project, idx) => {
      activeIdx = idx;
      updatePreview(project, true);
      const newHash = `#/${project.slug}/${lang}`;
      if (location.hash !== newHash) {
        history.replaceState(null, '', newHash);
      }
    },
  });

  // Render inicial del preview (sin animación) i favicon de l'actiu
  updatePreview(activeProject, false);
  setFavicon(activeProject.slug);

  // Si la home se abre con iris activo (porque venimos de un proyecto), el
  // app.js se encargará de llamar a Iris.uncover; no es responsabilidad de home.

  return {
    getMirillaCenter() {
      const r = mirilla.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
