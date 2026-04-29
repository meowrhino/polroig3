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
  onPreview,         // (project, index) => void — disparado en cada cambio mentre es gira (drag o keyboard)
  onSettle,          // (project, index) => void — disparado quan la roda fa snap final
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

  // Marca quin item està actiu visualment (la classe és_active s'aplica
  // sempre, amb o sense esdeveniments). Si emit==='preview', dispara
  // onPreview; si emit==='settle', dispara onSettle (només quan canvia).
  function updateActive(emit = 'preview') {
    let k = Math.round((90 - R) / STEP);
    if (wraps) k = ((k % SLOTS) + SLOTS) % SLOTS;
    k = Math.max(0, Math.min(N - 1, k));

    const changed = (k !== activeIdx);
    activeIdx = k;
    stageEl.querySelectorAll('.wheel__item').forEach(el => {
      el.classList.toggle('is-active', Number(el.dataset.index) === k);
    });
    if (!changed) {
      // Quan el slot no canvia, només emetem si és un settle: el snap
      // final ha de re-confirmar el text del preview encara que l'usuari
      // hagi tornat al mateix slot després d'un drag.
      if (emit === 'settle' && onSettle) onSettle(projects[k], k);
      return;
    }
    if (emit === 'preview' && onPreview) onPreview(projects[k], k);
    if (emit === 'settle'  && onSettle)  onSettle(projects[k], k);
  }

  function snap() {
    let snapped = Math.round(R / STEP) * STEP;
    snapped = clamp(snapped);
    R = snapped;
    wheelEl.classList.remove('is-dragging');
    applyTransform();
    // Esperem el fi de la transició per emetre el "settle" (visual sincronitzat)
    requestAnimationFrame(() => updateActive('settle'));
  }

  // Click directe en un item: anima el snap i dispara settle (= preview + settle).
  function setIndex(idx, animate = true) {
    idx = Math.max(0, Math.min(N - 1, idx));
    R = clamp(targetR(idx));
    if (!animate) wheelEl.classList.add('is-dragging');
    applyTransform();
    if (!animate) {
      void wheelEl.offsetHeight;
      wheelEl.classList.remove('is-dragging');
    }
    // Emetem preview de l'estat nou (si hi ha mirilla per actualitzar) i,
    // tot seguit, settle al snap final.
    if (onPreview && projects[idx]) onPreview(projects[idx], idx);
    requestAnimationFrame(() => updateActive('settle'));
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
    // normalitzar salts en ±180
    if (delta >  180) delta -= 360;
    if (delta < -180) delta += 360;
    totalMove += Math.abs(delta);
    R = clamp(startR + delta);
    applyTransform();
    // Mentre arrossegues, emetem onPreview cada cop que el slot sota
    // el selector canvia (la mirilla s'actualitza en viu).
    updateActive('preview');
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

  // ----- Teclat -----
  // Registrem un únic listener al mòdul; actualitzem la referència a la
  // roda activa cada cop que es crea una de nova (al canviar d'idioma,
  // p.ex.). Així evitem acumular listeners i no toquem el `window`.
  const api = { setIndex, getIndex: () => activeIdx };
  _activeWheel = api;
  installKeyboardListener();

  // Render inicial — sense emetre cap esdeveniment, només marca actiu.
  applyTransform();
  updateActive(null);

  return api;
}

// Estat de mòdul per al listener global de teclat (només a la home).
let _activeWheel = null;
let _kbInstalled = false;
function installKeyboardListener() {
  if (_kbInstalled) return;
  _kbInstalled = true;
  document.addEventListener('keydown', (ev) => {
    if (document.body.dataset.view !== 'home') return;
    if (!_activeWheel) return;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
      ev.preventDefault();
      _activeWheel.setIndex(_activeWheel.getIndex() + 1);
    } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      _activeWheel.setIndex(_activeWheel.getIndex() - 1);
    }
  });
}
