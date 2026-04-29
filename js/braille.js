// braille.js — convierte texto plano a caracteres Unicode Braille (alfabeto Braille grado 1).
// Solo cubre a-z y espacio; suficiente para "pol roig".

const MAP = {
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓',
  i: '⠊', j: '⠚', k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏',
  q: '⠟', r: '⠗', s: '⠎', t: '⠞', u: '⠥', v: '⠧', w: '⠺', x: '⠭',
  y: '⠽', z: '⠵', ' ': ' ',
};

export function toBraille(str = '') {
  return str.toLowerCase().split('').map(c => MAP[c] ?? '').join('');
}
