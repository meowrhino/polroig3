// mirilla.js — gestiona el swap animado de la mirilla central.
// La animación es 100% CSS (clase .is-swapping). Aquí solo:
//  1. precargamos la imagen siguiente
//  2. seteamos --next-img como custom property en el elemento
//  3. añadimos .is-swapping
//  4. al acabar, swappeamos el src real y limpiamos la clase

const SWAP_DUR = 1100; // sincronizado con --swap-dur en CSS
const reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;

function preload(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

export async function swapMirilla(mirillaEl, nextSrc, animate = true) {
  if (!mirillaEl) return;
  const imgEl = mirillaEl.querySelector('.mirilla__img');
  if (!imgEl) return;
  if (imgEl.getAttribute('src') === nextSrc) return;

  await preload(nextSrc);

  if (!animate || reduce) {
    imgEl.src = nextSrc;
    return;
  }

  // El ::after toma --next-img como background y crece desde el centro.
  mirillaEl.style.setProperty('--next-img', `url("${nextSrc}")`);
  mirillaEl.classList.add('is-swapping');

  await new Promise(r => setTimeout(r, SWAP_DUR));

  imgEl.src = nextSrc;
  mirillaEl.classList.remove('is-swapping');
  mirillaEl.style.removeProperty('--next-img');
}
