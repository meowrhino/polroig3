// braille.js — converteix text pla a HTML amb dots de braille (grau 1).
// Cada lletra es renderitza com un grid 2x3 de divs, mostrant només els
// punts actius (els buits no existeixen al DOM, no es veuen). Així el
// look no depèn de la font del navegador.
//
// Posicions del braille (estàndard):
//   1 4
//   2 5
//   3 6
// El MAP guarda quines posicions estan activades per cada lletra.

const MAP = {
  a: [1],          b: [1,2],        c: [1,4],        d: [1,4,5],
  e: [1,5],        f: [1,2,4],      g: [1,2,4,5],    h: [1,2,5],
  i: [2,4],        j: [2,4,5],      k: [1,3],        l: [1,2,3],
  m: [1,3,4],      n: [1,3,4,5],    o: [1,3,5],      p: [1,2,3,4],
  q: [1,2,3,4,5],  r: [1,2,3,5],    s: [2,3,4],      t: [2,3,4,5],
  u: [1,3,6],      v: [1,2,3,6],    w: [2,4,5,6],    x: [1,3,4,6],
  y: [1,3,4,5,6],  z: [1,3,5,6],
};

// Devuelve un string HTML que el caller puede inyectar via innerHTML.
// Cada caracter es un .braille-char (grid 2x3) que contiene N .braille-dot
// (sólo los activos). Los espacios son .braille-space.
export function toBrailleHTML(str = '') {
  return str.toLowerCase().split('').map(c => {
    if (c === ' ') return '<span class="braille-space"></span>';
    const dots = MAP[c];
    if (!dots) return '';
    const dotsHTML = dots.map(p => `<span class="braille-dot" data-pos="${p}"></span>`).join('');
    return `<span class="braille-char">${dotsHTML}</span>`;
  }).join('');
}
