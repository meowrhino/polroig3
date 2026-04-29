// data.js — carga data.json una vez, cachea, y expone helpers de i18n y rutas.

let _data = null;

export async function loadData() {
  if (_data) return _data;
  const res = await fetch('data/data.json');
  if (!res.ok) throw new Error(`No se pudo cargar data.json (${res.status})`);
  _data = await res.json();
  return _data;
}

export function getData() { return _data; }

// Devuelve el valor del campo en el idioma activo, con fallback al default
// y luego al primer idioma disponible. Soporta strings simples (mismo en todos
// los idiomas) y objetos { cat, es, en }.
export function pickLang(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  if (typeof field !== 'object') return String(field);
  if (field[lang]) return field[lang];
  const def = _data?.config?.idioma_defecto;
  if (def && field[def]) return field[def];
  const firstKey = Object.keys(field)[0];
  return firstKey ? field[firstKey] : '';
}

// Idioma efectivo a usar dada una candidatura (puede venir vacía o inválida).
export function resolveLang(candidate) {
  const langs = _data?.config?.idiomas || ['cat'];
  if (candidate && langs.includes(candidate)) return candidate;
  return _data?.config?.idioma_defecto || langs[0];
}

// Devuelve el proyecto por slug o null.
export function findProject(slug) {
  return _data?.proyectos?.find(p => p.slug === slug) || null;
}

// Devuelve el índice del proyecto por slug, o -1.
export function indexOfProject(slug) {
  return _data?.proyectos?.findIndex(p => p.slug === slug) ?? -1;
}

// Path a la mirilla de un proyecto (convención: data/<slug>/mirilla.webp).
export function mirillaPath(slug) {
  return `data/${slug}/mirilla.webp`;
}

// Path a una imagen del slideshow (relativa al folder img del proyecto).
export function imgPath(slug, filename) {
  return `data/${slug}/img/${filename}`;
}

// Texto de UI traducido. Devuelve '' si no existe la clave.
export function t(key, lang) {
  return _data?.i18n?.[lang]?.[key] ?? '';
}
