# polroig3

Portfolio de **Pol Roig Valldosera** — director musical i d'escena.
Tercera iteració. Vanilla HTML/CSS/JS sense build step. Mobile-first.

---

## Què és això

Un portfolio amb dues vistes:

- **Home** — una roda de 12 segments amb sis projectes (els altres 6 huecs estan buits). Al centre, una *mirilla* circular amb una imatge ull-de-peix del projecte seleccionat. A sota, un previsualització de tres línies del projecte amb un "… veure més".
- **Pàgina de projecte** — slideshow + títol + text + text desplegable, agrupat en blocs ("grups").

Animacions clau:

- **Mirilla en swap** — gira 360° + iris-grow quan canvies de projecte a la roda.
- **Iris al entrar/sortir** — un cercle negre creix des de la mirilla per cobrir tota la pantalla; al tornar, es contrau cap a la mirilla.
- **Roda tipus telèfon antic** — gira amb drag/touch i fa snap a cada slot. No fa la volta sencera fins que els 12 huecs estan plens.

---

## Estructura

```
polroig3/
├── index.html             # Shell SPA + meta SEO + <noscript>
├── README.md
├── robots.txt
├── sitemap.xml
├── css/
│   └── style.css           # Tots els estils (mobile-first, custom props)
├── js/
│   ├── app.js              # Router per hash + bootstrap
│   ├── data.js             # Carrega data.json + helpers i18n
│   ├── home.js             # Vista home (header + roda + mirilla + preview + footer)
│   ├── wheel.js            # Mecànica de la roda 12 segments
│   ├── mirilla.js          # Swap animat de la mirilla
│   ├── project.js          # Vista de pàgina de projecte
│   ├── slideshow.js        # Component slideshow
│   ├── desplegable.js      # Component "llegir més"
│   ├── iris.js             # Animació iris d'entrada/sortida
│   ├── lang.js             # Selector d'idioma (footer)
│   └── braille.js          # Helper de text → Unicode Braille
├── data/
│   ├── data.json
│   └── <slug>/
│       ├── mirilla.webp    # Generada amb tools/mirillaGen.html
│       └── img/
│           └── *.webp      # Imatges del slideshow
└── tools/
    └── mirillaGen.html     # Generador de mirilles (efecte ull-de-peix)
```

---

## Posada en marxa local

Cal servir-ho amb un servidor estàtic (no obrir `index.html` amb `file://` —
els ES modules no funcionen així).

```bash
cd polroig3
python3 -m http.server 8000
# o
npx serve
```

Després obre `http://localhost:8000`.

---

## `data/data.json` — esquema

Tota la informació viu en aquest fitxer.

### `config`

```jsonc
{
  "color_acento": "magenta",       // Color d'accent (links, "veure més", selector, idioma actiu...)
  "color_titulo": "red",           // Color del títol braille i petits accents
  "idioma_defecto": "cat",
  "idiomas": ["cat", "en"],
  "titulo_braille": "pol roig",    // El text que es mostrarà en braille a la capçalera
  "dominio": "polroigvalldosera.com"   // Domini de la còpia del client (no usat pel codi; metadata)
}
```

### `i18n`

Textos d'interfície traduïts:

```jsonc
"i18n": {
  "cat": { "ver_mas": "veure més", "leer_mas": "llegir més", "leer_menos": "tancar", "volver": "tornar", "idiomas": { "cat": "cat", "en": "en" } },
  "en":  { "ver_mas": "view more", "leer_mas": "read more",  "leer_menos": "close",  "volver": "back",   "idiomas": { "cat": "cat", "en": "en" } }
}
```

### `proyectos[]`

L'**ordre** del array determina la posició a la roda:

- `proyectos[0]` → slot 0 (12h)
- `proyectos[1]` → slot 1 (1h)
- ...
- `proyectos[3]` → slot 3 (3h, **selector**) ← arrenca aquí per defecte
- ...

Si hi ha menys de 12 projectes, els slots restants queden buits i la roda no
farà la volta sencera (comportament tipus telèfon antic).

Cada projecte:

```jsonc
{
  "slug": "concierto-barroco",                        // identificador URL-safe
  "nombre": "Concierto Barroco",                      // string simple — els noms no es tradueixen
  "grupos": [
    {
      "slideshow": ["01.webp", "02.webp"],            // opcional. Paths relatius a data/<slug>/img/
      "titulo": { "cat": "...", "en": "..." },        // opcional. Pot ser string o objecte multilingüe
      "texto": [                                       // opcional. Array de paràgrafs (i18n)
        { "cat": "...", "en": "..." }
      ],
      "texto_desplegable": [                           // opcional. Apareixen darrere d'un "llegir més"
        { "cat": "...", "en": "..." }
      ]
    }
  ]
}
```

**Tots els camps de `grupos[*]` són opcionals.** Si un grup queda totalment
buit, no es renderitza. Si una clau específica falta, el seu sub-bloc
simplement no es mostra.

El **preview de la home** s'autocalcula del primer paràgraf del primer grup,
truncat a 3 línies amb CSS.

---

## Afegir un projecte

1. Afegir l'entrada a `proyectos[]` a `data/data.json`.
2. Crear la carpeta `data/<slug>/`.
3. Generar la mirilla (vegeu sota) i col·locar-la com `data/<slug>/mirilla.webp`.
4. Posar les imatges del slideshow a `data/<slug>/img/`.

---

## Generar mirilles

Obre `tools/mirillaGen.html` directament al navegador (no cal servidor).

- Arrossega imatges, fes click per seleccionar, o pega amb **Cmd/Ctrl+V**.
- Accepta **JPG, PNG, WebP, AVIF**.
- Ajusta els sliders (mida, qualitat, desenfocament, viñeta) si vols afinar
  l'estètica. Els valors per defecte funcionen bé.
- Activa **renombrar seqüencial** si vols que les sortides siguin
  `mirilla-1.webp`, `mirilla-2.webp`, etc.
- Descarrega individual o tot junt en zip.

Tot passa al navegador — res no es puja a cap servidor.

---

## Customitzar colors

A `data/data.json` → `config`:

- `color_acento` — usat per links, "veure més", selector de la roda, idioma
  actiu, fletxes del slideshow, "llegir més", títols dels grups.
- `color_titulo` — usat pel text "pol roig" en braille a la capçalera.

Pot ser qualsevol valor CSS vàlid: nom (`magenta`), hex (`#ff00ff`), `rgb(...)`, etc.

---

## Afegir un idioma

1. Afegir la clau a `config.idiomas` (e.g. `"fr"`).
2. Omplir `i18n.fr` amb totes les claus.
3. Afegir la clau als camps i18n dels projectes (`titulo`,
   paràgrafs de `texto` i `texto_desplegable`). El camp `nombre` és string
   simple — els noms dels projectes no es tradueixen.

Un idioma que falti en un camp puntual cau al `idioma_defecto` i, si tampoc
hi és, al primer disponible.

---

## Animacions — resum

| Quan                              | Què passa |
|-----------------------------------|-----------|
| Gires la roda                     | Snap a slot més proper (rotary phone, sense rebot a l'extrem) |
| Canvies de projecte a la roda     | La mirilla gira 360° + iris-grow amb la imatge nova |
| Cliques la mirilla o "veure més" | Cercle negre creix des de la mirilla i cobreix tot. Es renderitza la pàgina del projecte. Un forat transparent creix des del centre i revela la pàgina |
| Cliques "← tornar" o back         | El forat es tanca al centre. Es renderitza la home. El cercle negre es contrau cap a la mirilla |
| Slideshow                         | Click a la zona del 10% esquerra/dreta → translació amb easing |
| "Llegir més"                       | Transició de `max-height` |

Tot respecta `prefers-reduced-motion: reduce` i salta a l'estat final sense animació.

---

## Routing (URL hash)

- `#/` — home, idioma per defecte, projecte inicial (slot 3)
- `#/<slug>` — home amb `<slug>` al selector
- `#/<slug>/<lang>` — home + idioma
- `#/proyecto/<slug>` — pàgina de projecte
- `#/proyecto/<slug>/<lang>` — pàgina de projecte + idioma

---

## Deploy a GitHub Pages

1. Push del repo a GitHub.
2. Settings → Pages → Source: `main` branch, root.
3. El repo viu, per defecte, a `https://<usuari>.github.io/<repo>/`.
4. Per a un domini propi (la copia del client): afegir un fitxer `CNAME`
   amb el domini, configurar el DNS (`CNAME` apuntant a `<usuari>.github.io`
   o `A` records a les IPs de GitHub Pages) i marcar "Enforce HTTPS" un
   cop propagat.

També funciona en qualsevol host estàtic (Netlify, Vercel, Cloudflare Pages)
sense modificacions, ja que no hi ha build.

---

## SEO

- `index.html` té `<title>`, `description`, OG, Twitter card, hreflang i
  `canonical`. Per defecte apunten al deploy del repo a GitHub Pages
  (`meowrhino.github.io/polroig3/`); el `robots.txt` i `data.json`
  (`config.dominio`) referencien el domini que farà servir el client a
  la seva còpia.
- `sitemap.xml` llista la home i una entrada per projecte (URLs amb hash;
  els crawlers moderns les indexen).
- `robots.txt` permet tot.
- Si afegeixes un projecte, recorda afegir-lo també a `sitemap.xml`.
- Si canvies de domini, actualitza `index.html` (canonical, OG, hreflang),
  `sitemap.xml`, `robots.txt` i afegeix un fitxer `CNAME` amb el domini.

---

## Personalització ràpida

| Vols canviar...                   | On                                 |
|-----------------------------------|------------------------------------|
| El text de la capçalera braille   | `data.json` → `config.titulo_braille` |
| Els colors                         | `data.json` → `config.color_acento` / `color_titulo` |
| L'ordre dels projectes a la roda  | Reordena `data.json` → `proyectos[]`  |
| El reparte vertical de la home    | `css/style.css` → `--h-header / --h-wheel / --h-preview / --h-footer` |
| La mida de la roda i la mirilla   | `css/style.css` → `--wheel-size / --mirilla-size` |
| Les durades d'animació            | `css/style.css` (`--swap-dur`, `--snap-dur`) i `js/iris.js` (constants al cap) |

---

## Crèdits

- Animació iris portada de `valentin3`.
- Animació de la mirilla portada de `polroig2`.
- Generador de mirilles compartint llenguatge visual amb `imgToWeb`.
