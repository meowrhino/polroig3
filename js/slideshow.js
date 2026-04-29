// slideshow.js — slideshow simple con click-zones a izq/der.
// Recibe un array de URLs y crea el DOM. Si solo hay 1 imagen, no
// renderiza botones.

export function createSlideshow(images) {
  const root = document.createElement('div');
  root.className = 'slideshow';

  const track = document.createElement('div');
  track.className = 'slideshow__track';
  track.style.setProperty('--i', 0);

  for (const src of images) {
    const slide = document.createElement('div');
    slide.className = 'slideshow__slide';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = src;
    slide.appendChild(img);
    track.appendChild(slide);
  }

  root.appendChild(track);

  let i = 0;
  const total = images.length;

  function update() {
    track.style.setProperty('--i', i);
    if (prev) prev.disabled = (i === 0);
    if (next) next.disabled = (i === total - 1);
  }

  let prev = null, next = null;
  if (total > 1) {
    prev = document.createElement('button');
    prev.className = 'slideshow__btn slideshow__btn--prev';
    prev.innerHTML = '&lsaquo;';
    prev.setAttribute('aria-label', 'anterior');
    prev.addEventListener('click', () => { i = Math.max(0, i - 1); update(); });

    next = document.createElement('button');
    next.className = 'slideshow__btn slideshow__btn--next';
    next.innerHTML = '&rsaquo;';
    next.setAttribute('aria-label', 'siguiente');
    next.addEventListener('click', () => { i = Math.min(total - 1, i + 1); update(); });

    root.appendChild(prev);
    root.appendChild(next);
  }

  update();
  return root;
}
