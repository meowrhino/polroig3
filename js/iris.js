// iris.js — animación de iris para entrar/salir de un proyecto.
// Patrón portado de valentin3: un overlay full-screen con mask radial
// cuyo agujero (transparente) crece o se contrae alrededor de un punto.
//
// Cuatro funciones públicas:
//   cover(x,y)   — círculo NEGRO crece desde (x,y) hasta cubrir todo
//   reveal(x,y)  — agujero TRANSPARENTE crece desde (x,y) hasta despejar todo
//   close(x,y)   — agujero TRANSPARENTE se contrae hacia (x,y) (cubre todo)
//   uncover(x,y) — círculo NEGRO se contrae hacia (x,y) (despeja todo)
//
// El overlay vive en #iris (se crea en index.html). Mientras está activo,
// captura clicks (.is-active añade pointer-events:auto).

const COVER_DUR  = 550;
const REVEAL_DUR = 650;
const PAUSE_DUR  = 90;

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let busy = false;

function el() { return document.getElementById('iris'); }

function setMask(x, y, holeRadius) {
  // holeRadius = radio del agujero transparente.
  // Para "cover" (overlay opaco que crece): invertimos los stops.
  // Aquí el contrato es: holeRadius = tamaño del círculo TRANSPARENTE
  // dentro del overlay. Para crear un círculo NEGRO usamos otra función.
  const node = el();
  const grad = `radial-gradient(circle at ${x}px ${y}px, transparent ${holeRadius}px, black ${holeRadius + 1}px)`;
  node.style.webkitMaskImage = grad;
  node.style.maskImage       = grad;
}

// Versión "círculo negro": cuando crece, tapa la pantalla.
// Implementado como overlay invertido: la máscara es opaca dentro del
// círculo, transparente fuera. Conseguimos eso con stops invertidos.
function setNegMask(x, y, blackRadius) {
  const node = el();
  const grad = `radial-gradient(circle at ${x}px ${y}px, black ${blackRadius}px, transparent ${blackRadius + 1}px)`;
  node.style.webkitMaskImage = grad;
  node.style.maskImage       = grad;
}

function maxRadius(x, y) {
  const w = innerWidth, h = innerHeight;
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 40;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animate(durationMs, onFrame) {
  if (reduce) { onFrame(1); return Promise.resolve(); }
  return new Promise(resolve => {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / durationMs);
      onFrame(easeInOutCubic(t));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

function activate() { el().classList.add('is-active'); }
function deactivate() {
  el().classList.remove('is-active');
  // Resetea la máscara a "todo transparente" para no afectar a nada.
  el().style.webkitMaskImage = 'radial-gradient(circle at 50% 50%, transparent 9999px, black 9999px)';
  el().style.maskImage       = 'radial-gradient(circle at 50% 50%, transparent 9999px, black 9999px)';
}

export const Iris = {
  isBusy() { return busy; },

  // Crece desde (x,y) cubriendo todo (deja la pantalla en negro).
  async cover(x, y) {
    busy = true;
    activate();
    const R = maxRadius(x, y);
    setNegMask(x, y, 0);
    await animate(COVER_DUR, p => setNegMask(x, y, p * R));
  },

  // Crece un agujero transparente desde (x,y) (revela la pantalla).
  // El estado entrante (de cover) ya tiene la pantalla cubierta.
  async reveal(x, y) {
    activate();
    const R = maxRadius(x, y);
    // setMask con holeRadius=0 → todo opaco. Cambiamos al "form" de mask
    // de revelado y animamos el agujero creciendo.
    setMask(x, y, 0);
    await animate(REVEAL_DUR, p => setMask(x, y, p * R));
    deactivate();
    busy = false;
  },

  // Cierra (contrae el agujero transparente hacia (x,y)).
  async close(x, y) {
    busy = true;
    activate();
    const R = maxRadius(x, y);
    setMask(x, y, R);
    await animate(COVER_DUR, p => setMask(x, y, (1 - p) * R));
  },

  // Descubre (contrae el círculo negro hacia (x,y)).
  async uncover(x, y) {
    activate();
    const R = maxRadius(x, y);
    setNegMask(x, y, R);
    await animate(REVEAL_DUR, p => setNegMask(x, y, (1 - p) * R));
    deactivate();
    busy = false;
  },

  pause() {
    return reduce ? Promise.resolve() : new Promise(r => setTimeout(r, PAUSE_DUR));
  },
};
