// desplegable.js — bloque "leer más / leer menos" con transición suave de altura.
// Recibe un array de párrafos ya en el idioma activo y los textos i18n
// del botón. El cuerpo arranca cerrado.

export function createDesplegable(parrafos, txtMas, txtMenos) {
  const root = document.createElement('div');
  root.className = 'desplegable';
  root.dataset.state = 'closed';

  const body = document.createElement('div');
  body.className = 'desplegable__body';
  for (const p of parrafos) {
    const el = document.createElement('p');
    el.textContent = p;
    body.appendChild(el);
  }

  const toggle = document.createElement('button');
  toggle.className = 'desplegable__toggle';
  toggle.textContent = txtMas;

  toggle.addEventListener('click', () => {
    const isOpen = root.dataset.state === 'open';
    if (isOpen) {
      // Set max-height al actual antes de animar a 0 (para que tenga "from")
      body.style.maxHeight = body.scrollHeight + 'px';
      requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
      root.dataset.state = 'closed';
      toggle.textContent = txtMas;
    } else {
      body.style.maxHeight = body.scrollHeight + 'px';
      root.dataset.state = 'open';
      toggle.textContent = txtMenos;
      // tras la transición, dejamos max-height en "none" para que reaccione
      // a cambios de viewport (ej. al cambiar idioma con texto más largo).
      body.addEventListener('transitionend', function once() {
        if (root.dataset.state === 'open') body.style.maxHeight = 'none';
        body.removeEventListener('transitionend', once);
      });
    }
  });

  root.appendChild(toggle);
  root.appendChild(body);
  return root;
}
