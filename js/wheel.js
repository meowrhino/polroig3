// wheel.js — rueda de 12 segmentos con comportamiento "rotary phone".
// Items en posiciones fijas (slot 0 = 12h, slot 3 = 3h = selector).
// El usuario hace drag (touch o mouse) → la rueda gira → snap al slot
// más cercano → callback con el slug del proyecto bajo el selector.
//
// Bounds:
//   - con N proyectos llenos en slots 0..N-1, R puede ir entre minR y maxR.
//   - selector está en slot 3 (90º clockwise desde el top).
//   - rotación R lleva el slot K al selector cuando K*30 + R = 90 → R = 90 - K*30.
//   - selecciona slot 0 (proyecto 1)  → R = +90
//   - selecciona slot N-1 (último proy) → R = 90 - (N-1)*30
//   - si N === 12 → sin bounds (puede dar la vuelta)

const STEP = 30;          // grados por slot
const SLOTS = 12;
const SELECTOR_SLOT = 3;  // 3h
const SNAP_DRAG_THRESHOLD = 6; // px — distinguir click de drag

export function createWheel({
  stageEl,           // .wheel-stage (contenedor)
  wheelEl,           // .wheel (el elemento que rota)
  projects,          // array de proyectos (orden = slot)
  initialIndex,      // índice del proyecto que arranca en el selector
  onChange,          // (project, index) => void — llamado al cambiar selección
  onActivate,        // (project, index) => void — llamado al hacer click en el item activo (no usado por defecto)
}) {
  const N = projects.length;
  const wraps = (N === SLOTS);

  // Grados → R que pone el slot K bajo el selector
  const targetR = (k) => 90 - k * STEP;

  // Bounds (sólo si no wraps)
  const minR = wraps ? -Infinity : targetR(N - 1);   // último proyecto al selector
  const maxR = wraps ?  Infinity : targetR(0);       // primer proyecto al selector

  let R = targetR(initialIndex);
  let activeIdx = initialIndex;

  function clamp(r) {
    if (wraps) return r;
    return Math.max(minR, Math.min(maxR, r));
  }

  function applyTransform() {
    wheelEl.style.transform = `rotate(${R}deg)`;
  }

  function updateActive(emit = true) {
    // ¿qué slot ha quedado bajo el selector?
    // Necesitamos el K más cercano a (90 - R) / STEP.
    let k = Math.round((90 - R) / STEP);
    if (wraps) k = ((k % SLOTS) + SLOTS) % SLOTS;
    k = Math.max(0, Math.min(N - 1, k));

    if (k !== activeIdx) {
      activeIdx = k;
      stageEl.querySelectorAll('.wheel__item').forEach(el => {
        el.classList.toggle('is-active', Number(el.dataset.index) === k);
      });
      if (emit && onChange) onChange(projects[k], k);
    } else {
      stageEl.querySelectorAll('.wheel__item').forEach(el => {
        el.classList.toggle('is-active', Number(el.dataset.index) === k);
      });
    }
  }

  function snap() {
    // Snap al múltiplo de STEP más cercano, dentro de bounds.
    let snapped = Math.round(R / STEP) * STEP;
    snapped = clamp(snapped);
    R = snapped;
    wheelEl.classList.remove('is-dragging');
    applyTransform();
    // Esperar fin de transición para emitir el cambio (visual sincronizado)
    requestAnimationFrame(() => updateActive());
  }

  function setIndex(idx, animate = true) {
    idx = Math.max(0, Math.min(N - 1, idx));
    R = clamp(targetR(idx));
    if (!animate) wheelEl.classList.add('is-dragging');
    applyTransform();
    if (!animate) {
      // forzar reflow y devolver a transition normal
      void wheelEl.offsetHeight;
      wheelEl.classList.remove('is-dragging');
    }
    updateActive();
  }

  // ----- Drag (pointer events) -----
  let dragging = false;
  let startAngle = 0;
  let startR = 0;
  let totalMove = 0;

  function pointAngle(ev) {
    const rect = wheelEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = ev.clientX - cx;
    const dy = ev.clientY - cy;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }

  function onPointerDown(ev) {
    if (ev.target.closest('.mirilla')) return; // no interceptar clicks en mirilla
    dragging = true;
    totalMove = 0;
    startAngle = pointAngle(ev);
    startR = R;
    wheelEl.classList.add('is-dragging');
    wheelEl.setPointerCapture?.(ev.pointerId);
  }
  function onPointerMove(ev) {
    if (!dragging) return;
    const a = pointAngle(ev);
    let delta = a - startAngle;
    // normalizar saltos en ±180
    if (delta >  180) delta -= 360;
    if (delta < -180) delta += 360;
    totalMove += Math.abs(delta);
    R = clamp(startR + delta);
    applyTransform();
  }
  function onPointerUp(ev) {
    if (!dragging) return;
    dragging = false;
    wheelEl.releasePointerCapture?.(ev.pointerId);
    snap();
  }

  stageEl.addEventListener('pointerdown', onPointerDown);
  stageEl.addEventListener('pointermove', onPointerMove);
  stageEl.addEventListener('pointerup',   onPointerUp);
  stageEl.addEventListener('pointercancel', onPointerUp);

  // ----- Click en item -----
  stageEl.addEventListener('click', (ev) => {
    const item = ev.target.closest('.wheel__item');
    if (!item) return;
    if (totalMove > SNAP_DRAG_THRESHOLD) return; // era un drag, no un click
    const idx = Number(item.dataset.index);
    if (Number.isFinite(idx)) setIndex(idx);
  });

  // ----- Teclado -----
  // Registramos un único listener global por ventana, con un puntero
  // mutable a la rueda activa para evitar acumulación de listeners
  // cuando la home se remonta (ej. al cambiar idioma).
  installKeyboardListener();
  window.__activeWheel = { setIndex, getIndex: () => activeIdx };

  // Render inicial
  applyTransform();
  updateActive(false);

  return { setIndex, getIndex: () => activeIdx };
}

let _kbInstalled = false;
function installKeyboardListener() {
  if (_kbInstalled) return;
  _kbInstalled = true;
  document.addEventListener('keydown', (ev) => {
    if (document.body.dataset.view !== 'home') return;
    const w = window.__activeWheel;
    if (!w) return;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
      ev.preventDefault();
      w.setIndex(w.getIndex() + 1);
    } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      w.setIndex(w.getIndex() - 1);
    }
  });
}
