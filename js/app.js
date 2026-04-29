// app.js — bootstrap + router por hash. Orquesta vistas (home/proyecto)
// y coordina la animación de iris en las transiciones.
//
// Hashes soportados:
//   #/                          → home, idioma defecto, proyecto inicial (slot 3)
//   #/<slug>                    → home con <slug> bajo el selector
//   #/<slug>/<lang>             → home + idioma
//   #/proyecto/<slug>            → página proyecto, idioma defecto
//   #/proyecto/<slug>/<lang>     → página proyecto + idioma

import { loadData, getData, resolveLang, findProject } from './data.js';
import { renderHome }    from './home.js';
import { renderProject } from './project.js';
import { Iris }          from './iris.js';

const SELECTOR_SLOT = 3;

const root = document.getElementById('app');

// Estado de la SPA. Lo mantenemos para gestionar transiciones (sabemos
// si venimos de home o de proyecto sin tener que parsear el hash anterior).
const state = {
  view: null,        // 'home' | 'proyecto'
  slug: null,
  lang: null,
  homeAPI: null,     // refs devueltos por renderHome (para uncover en vuelta)
};

// ---- Parseo del hash ----
function parseHash() {
  const raw = (location.hash || '#/').replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);

  // proyecto/<slug>[/<lang>]
  if (parts[0] === 'proyecto' && parts[1]) {
    return { view: 'proyecto', slug: parts[1], lang: resolveLang(parts[2]) };
  }
  // <slug>[/<lang>] o solo <lang> o vacío
  const data = getData();
  const slug0 = parts[0];
  const isLang = (s) => data.config.idiomas.includes(s);

  // <lang> solo (sin slug) — proyecto por defecto (slot 3)
  if (slug0 && isLang(slug0)) {
    return { view: 'home', slug: defaultSlug(), lang: slug0 };
  }
  // <slug>/<lang>
  if (slug0 && findProject(slug0)) {
    return { view: 'home', slug: slug0, lang: resolveLang(parts[1]) };
  }
  // fallback
  return { view: 'home', slug: defaultSlug(), lang: resolveLang() };
}

function defaultSlug() {
  const data = getData();
  const projects = data.proyectos;
  const idx = Math.min(SELECTOR_SLOT, projects.length - 1);
  return projects[idx].slug;
}

// ---- Inyección de colores configurables ----
function applyConfig() {
  const c = getData().config;
  document.documentElement.style.setProperty('--color-acento',  c.color_acento);
  document.documentElement.style.setProperty('--color-titulo',  c.color_titulo);
  document.documentElement.lang = c.idioma_defecto || 'ca';
}

// ---- Navegación con animación coordinada ----
async function navigate(target) {
  const { view, slug, lang } = parseHashFromString(target);
  await routeTo(view, slug, lang, { fromUserClick: true });
}

function parseHashFromString(hash) {
  const tmp = hash.startsWith('#') ? hash : '#' + hash;
  const old = location.hash;
  // hack ligero: pisamos location.hash temporalmente y reusamos parseHash
  history.replaceState(null, '', tmp);
  const parsed = parseHash();
  history.replaceState(null, '', old);
  return parsed;
}

async function routeTo(view, slug, lang, opts = {}) {
  document.body.dataset.view = view;
  state.view = view;
  state.slug = slug;
  state.lang = lang;

  if (view === 'home') {
    state.homeAPI = renderHome({
      root,
      slug,
      lang,
      onNavigateProject: async (href) => {
        // El cover ya lo hizo home.js antes de llamar aquí.
        history.pushState(null, '', href);
        await renderProjectAndReveal(href);
      },
      onChangeLang: (newLang) => {
        const newHash = `#/${slug}/${newLang}`;
        history.replaceState(null, '', newHash);
        routeTo('home', slug, newLang);
      },
    });

    // Si hay un iris pendiente (volvimos de un proyecto vía popstate o
    // back button), aplicamos uncover desde la posición de la mirilla.
    if (opts.uncoverFromProject) {
      const { x, y } = state.homeAPI.getMirillaCenter();
      await Iris.pause();
      await Iris.uncover(x, y);
    }
  }

  if (view === 'proyecto') {
    renderProject({
      root,
      slug,
      lang,
      onBack: async () => {
        if (Iris.isBusy()) return;
        await Iris.close(innerWidth / 2, innerHeight / 2);
        const newHash = `#/${slug}/${lang}`;
        history.pushState(null, '', newHash);
        await renderHomeAndUncover(slug, lang);
      },
      onChangeLang: (newLang) => {
        const newHash = `#/proyecto/${slug}/${newLang}`;
        history.replaceState(null, '', newHash);
        routeTo('proyecto', slug, newLang);
      },
    });

    if (opts.revealAfter) {
      window.scrollTo(0, 0);
      await Iris.pause();
      await Iris.reveal(innerWidth / 2, innerHeight / 2);
    }
  }
}

async function renderProjectAndReveal(hash) {
  const { view, slug, lang } = parseHashFromString(hash);
  await routeTo('proyecto', slug, lang, { revealAfter: true });
}

async function renderHomeAndUncover(slug, lang) {
  await routeTo('home', slug, lang, { uncoverFromProject: true });
}

// ---- Inicio ----
async function boot() {
  await loadData();
  applyConfig();

  const { view, slug, lang } = parseHash();
  await routeTo(view, slug, lang);

  // hashchange — disparado cuando el hash cambia por algo que NO ha sido
  // un replaceState/pushState nuestro: edición manual del hash o
  // back/forward del navegador. En los flujos home↔proyecto añadimos
  // la animación de iris para que back/forward también la tengan.
  window.addEventListener('hashchange', async () => {
    const next = parseHash();
    if (next.view === state.view && next.slug === state.slug && next.lang === state.lang) return;

    if (state.view === 'home' && next.view === 'proyecto' && !Iris.isBusy()) {
      const c = state.homeAPI?.getMirillaCenter() || { x: innerWidth / 2, y: innerHeight / 2 };
      await Iris.cover(c.x, c.y);
      await routeTo('proyecto', next.slug, next.lang, { revealAfter: true });
      return;
    }
    if (state.view === 'proyecto' && next.view === 'home' && !Iris.isBusy()) {
      await Iris.close(innerWidth / 2, innerHeight / 2);
      await routeTo('home', next.slug, next.lang, { uncoverFromProject: true });
      return;
    }
    routeTo(next.view, next.slug, next.lang);
  });
}

boot().catch(err => {
  console.error(err);
  root.innerHTML = `<p style="padding:2rem">Error cargando la web: ${err.message}</p>`;
});
