# Contrato de las páginas fijas · Aliviane (es-MX)

Base del 12-nov-2026 (agente A, tanda 1). Manda `~/material/planificador-2026-11/MOLDE_FIJAS.md` (secciones 0, 1 y 2)
y las reglas de la corrida en `~/material/planificador-2026-11/CONSTRUCCION.md`. Este archivo dice **cómo** se llena
una página para que cualquier agente lo haga sin preguntar.

**Una página = un archivo `fijas/paginas/<id>.json`.** De ahí salen solos la ruta, el HTML servido, el marcado,
el índice de su colección, el sitemap y la sección de ligas de la portada. `fijas/` no se publica (el workflow la
excluye); sí se publican las carpetas que genera.

## Archivos

| Archivo | Qué hace |
|---|---|
| `fijas/lista.json` | El plan: 169 páginas depuradas (copia de `aliviane/es/LISTA_CONSTRUIR.csv`). Se regenera con `node fijas/nueva.mjs --importar <csv>`. |
| `fijas/nueva.mjs <id>…` | Crea el esqueleto `fijas/paginas/<id>.json` desde la lista (borrador vacío). |
| `fijas/paginas/*.json` | Las páginas. |
| `fijas/lib.mjs` | Plantilla HTML, bloque de venta, marcado. Un solo lugar para el diseño de todas las fijas. |
| `fijas/generar.mjs` | Escribe lo publicado en el repo, o todo en un directorio de revisión con `--borradores <dir>` (copia `img/`, `js/`, `css/`, `fuentes/` y revisa que cada motor encuentre lo que carga). En modo repo no escribe nada si un motor publicado carga un archivo que no se publica (sin `git add`, o dentro de `fijas/`). |
| `fijas/probar.mjs` | Pruebas. Truenan con código 1. `--estricto` vuelve error los avisos (úsalo con las muestras). Siguen los `import` y `new URL(…, import.meta.url)` de cada motor: lo que falte truena, y lo que no se publique truena en publicadas y avisa en borradores. |
| `fijas/og.mjs` | Imágenes Open Graph con Chrome sin cabeza y perfil temporal: una por molde (`img/og/<molde>.png`) o una por página (`--pagina <id>`). |
| `fijas/generadas.json` | Lo que el generador escribió la última vez (para borrar lo que deja de estar publicado). No se edita a mano. |

## Rutas por molde

| `molde` | Ruta | Índice |
|---|---|---|
| `herramienta` | `/herramientas/<slug>/` | `/herramientas/` |
| `guia` | `/guias/<slug>/` | `/guias/` |
| `plantilla` | `/plantillas/<slug>/` | `/plantillas/` |
| `servicio` | `/<slug>/` | — |
| `comparativa` | `/comparar/<slug>/` | — |
| `por-giro` | `/paginas-web/<slug>/` | — |
| `por-ciudad` | `/diseno-web/<slug>/` | — |

Un índice existe sólo si tiene al menos una página publicada. El slug de un servicio no puede ser una carpeta o
archivo de la raíz (`sitios`, `img`, `js`, `css`, `netlify`, `fijas`, los índices…). Las pruebas lo revisan contra
toda la lista. **El slug y el molde son los de `fijas/lista.json` y no se cambian nunca.**

## Campos

| Campo | Regla |
|---|---|
| `id`, `slug` | Iguales a los de la lista. El archivo se llama `<id>.json`. |
| `molde` | Uno de los de arriba. |
| `cabeza` | La búsqueda cabeza de la lista. |
| `busquedas` | Las variantes que cubre (de la lista; puedes recortar las basura). No se muestran. |
| `title` | **≤ 58 caracteres**, empieza con la cabeza exacta y sigue con el beneficio que el top 3 promete y nosotros cumplimos. Sin punto final ni remate después de coma. « \| Aliviane» se agrega solo si cabe. |
| `h1` | Corto, con la búsqueda. Puede ser distinto del title. |
| `description` | **140 a 160 caracteres.** Contesta, da el beneficio y cierra con verbo. |
| `resumen` | Una línea para las tarjetas de índice y relacionadas. |
| `categoria` | Subtítulo en el índice (viene en la lista según la familia). |
| `categoriaApp` | Opcional, sólo herramientas: `applicationCategory` de schema.org (por omisión `BusinessApplication`). |
| `revisada` | `AAAA-MM` → «Revisada en [mes año]». Obligatoria si hay cifras, leyes o precios. |
| `respuesta` | Lista de 1 a 2 párrafos (2 a 4 frases en total) que contestan la búsqueda. Párrafo normal: sin etiqueta ni recuadro. |
| `herramienta` | `{ "id": "<motor>", "modo": "<modo>", "opciones"? }` o `null`. Ver «Motores». |
| `herramienta.opciones` | Opcional. Objeto que llega a `montar()` junto con `modo` e `idioma` (no los repite): `textos`, `diseno`, `formato`… según el motor. **Ligas a otra fija siempre como `"id:<página>"`**: el generador pone su ruta sólo si esa página está publicada (en borradores, si existe) y si no pone `""`, que apaga la liga en el motor. Una ruta escrita a mano hacia una fija truena en las pruebas. |
| `cuerpo` | Bloques (abajo). |
| `faqs` | `[{ pregunta, respuesta }]`. Cada respuesta **abre con la respuesta** («Sí.», «No.», «En pocos días.»). Emiten FAQPage. |
| `relacionadas` | 3 a 6 ids de hermanas (de la lista). Sólo se pintan las publicadas; una página publicada necesita 3 publicadas. |
| `venta` | `{ puente, aviso?, titulo?, tituloCorto?, mensaje?, trabajos? }`. Ver «Bloque de venta». |
| `servicio` | Sólo servicio, giro y ciudad: `{ nombre, tipo, ciudad? }` para el marcado Service (`ciudad` → `areaServed` City). |
| `fuentes` | `[{ texto, url }]`. Toda cifra, ley o precio de terceros lleva su fuente. Se pintan al pie. |
| `serp` | `[{ posicion, url, titulo, promete }]`: el top 3 leído antes de escribir (WebSearch modo standard; nunca el Chrome de Diego). |
| `creada`, `actualizado` | `AAAA-MM-DD`. `actualizado` es el `lastmod` y el `dateModified`. |
| `publicacion` | **La bandera.** `null` = borrador: no genera HTML, no entra a sitemap, índices ni portada. `'AAAA-MM-DD'` = sale desde ese día (corte en hora CDMX) en el siguiente `generar.mjs`. Publicar es decisión de Diego. |
| `nota` | Para el equipo. No se muestra. |

### Bloques del `cuerpo`

`{ "h2": "…" }`, `{ "h3": "…" }`, `{ "p": "…" }`, `{ "ul": ["…"] }`, `{ "ol": ["…"] }`,
`{ "pasos": [{ "titulo", "texto" }] }`, `{ "tabla": { "titulo"?, "columnas": [], "filas": [[]] } }`,
`{ "venta": true }` (bloque de venta corto a media página: guías y plantillas), `{ "trabajos": true }` (capturas).

En el texto: `**negrita**`, `[texto](/ruta)` y `[texto](id:otra-pagina)`. La liga `id:` se pinta sólo si esa página
está publicada (en borradores, si existe); si no, queda el texto solo. Úsala para ligar hermanas dentro del texto.

## Bloque de venta (MOLDE 2.1)

Lo arma `lib.mjs`, igual en todas: frase puente propia (`venta.puente`), «$1,500 con tu dominio incluido. Después
$99 al mes con hosting y cambios cada semana.», 2-3 trabajos con captura (`venta.trabajos`, ids de `TRABAJOS` en
`lib.mjs`; por omisión La Ola, Comprafin y Makatea), botón WhatsApp a `wa.me/523111223365` con mensaje prellenado que
nombra la página y lleva `(ref f-<slug>)`, «Ver ejemplos» a `/?c=f-<slug>#trabajos` y correo diego@aliviane.mx.
Las ligas a la portada llevan `?c=f-<slug>`.

- **Herramienta:** nunca encima. Aviso suave (`venta.aviso`, o el puente) que aparece debajo de la herramienta cuando
  el motor dispara `aliviane:resultado`, y bloque completo al cierre.
- **Guía y plantilla:** pon `{ "venta": true }` a media página; el bloque completo va solo al cierre.
- **Servicio, giro, ciudad:** bloque corto arriba (automático) y completo al cierre, con «Pagar mi landing».
- Agroqs y Avelina están pendientes del permiso de sus dueños para salir en el portafolio: prefiere los otros.

## Motores de herramienta

Los programan otros agentes en `js/herramientas/<id>.js` (módulo ES con `montar(contenedor, { modo, idioma: 'es-MX', textos? })`),
CSS en `css/herramientas.css`, librerías en `js/vendor/`. La página pone `<div class="ah-herramienta" data-herramienta data-modo>`
y un `<script type="module">` que importa sólo ese motor. Si el motor no existe, el borrador muestra un hueco neutro y
**la página no se puede publicar** (la prueba truena).

Ids asignados en la lista: `qr` (link, imagen, wifi, whatsapp, instagram, facebook, menu), `whatsapp-link`, `codigo-barras`,
`paleta` (generador, combinar, y un modo por color), `editor-diseno` (tarjeta-presentacion, flyer, folleto, volante,
banner, cartel, poster, letrero, letrero-abierto-cerrado, se-vende, lona, portada-facebook, iconos-destacadas,
post-instagram, horario, cupon, tarjeta-lealtad), `logo` (general, 3d, minimalista, letras, animado y por giro),
`nombres` (por giro), `slogan`, `favicon`, `firma-correo` (gmail), `documento` (recibo, recibo-renta, nota-remision,
nota-venta, cotizacion, orden-compra, orden-servicio, lista-precios), `texto-legal` (aviso-privacidad, terminos,
devoluciones), `menu` (restaurante, cafeteria, digital), `catalogo`.
**Propuestos por A (no estaban en el encargo):** `lector-qr` (camara, wifi), `visor-cfdi` (abre el XML de una
factura y lo pasa a PDF), `dominio-disponible` (consulta RDAP), y los modos nuevos `paleta/combinar`,
`editor-diseno/folleto|letrero|se-vende|lona|post-instagram`, `documento/orden-compra`. Si no se programan, esas
páginas pasan a guía (cambia el molde en la lista y vuelve a importar).

La muestra `formato-de-cotizacion` promete que el motor `documento` acepta logo, marca IVA incluido o aparte, y baja
PDF sin pedir correo. Si el motor no lo hace, ajusta el texto.

### Motores existentes (12-nov-2026)

Todos en `js/herramientas/<id>.js`, con `montar(contenedor, { modo, idioma: 'es-MX', textos? })`. Con un modo que no
conoce, cada motor usa su modo por omisión (el primero de su lista). Los que no traen modo aceptan `''`.

| Motor | Modos | Notas para la página |
|---|---|---|
| `qr` | link, whatsapp, wifi, texto, imagen, facebook, instagram, menu, telefono, correo, contacto | |
| `whatsapp-link` | link, qr | |
| `codigo-barras` | ean13, ean8, upca, code128, code39, itf, hoja | |
| `paleta` | generador, complementarios, analogos, triada, monocromatico, imagen y por color: azul, cafe, gris, beige, naranja, tierra, lila, amarillo, blanco, elegante, frios, calidos, pastel, verde, rojo, rosa, morado, negro | `combinar` no existe como modo: se ve como el generador. |
| `editor-diseno` | tarjeta-presentacion, tarjeta-digital (la misma tarjeta, abre en «Para WhatsApp» 1080 × 600 px), flyer, rifa (flyer + boletos numerados), volante, cartel, poster, banner, lona, letrero, letrero-abierto-cerrado, horario, se-vende, cupon, tarjeta-lealtad, portada-facebook, post-instagram, iconos-destacadas, folleto | `"opciones": { "diseno": "<id>" }` abre en ese diseño (ids en `js/herramientas/editor-diseno/<archivo>.js`, p. ej. flyer: panaderia, fiesta, informativo, futbol, rifa, comida; tarjeta: despacho, ferreteria, taqueria, estetica, consultorio, taller). `"formato": "<id>"` abre en esa medida. Cada combinación guarda lo del usuario aparte en el equipo. En tarjetas, flyer/volante, cartel/poster, lona/banner y folleto hay una casilla (apagada) para bajar el PDF con 3 mm de sangrado, marcas de corte y TrimBox/BleedBox; la hoja carta no la usa. **Folio consecutivo:** en `cupon` una casilla numera cada cupón (No. 0001…) y en la hoja cada lugar lleva su número; el modo `rifa` (flyer con un diseño más, «Boletos numerados»: 10 por hoja carta con talón, 001…) numera siempre. Se elige primer número y cuántas hojas, y el que sigue se guarda en el equipo. |
| `logo` | general, minimalista, 3d, letras, animado y por giro: restaurante, ropa, camisetas, unas, barberia, carniceria, constructora, transporte, futbol | |
| `documento` | recibo, recibo-renta, recibo-honorarios, nota-remision, nota-venta, cotizacion, orden-compra, orden-servicio, lista-precios | |
| `menu` | restaurante, cafeteria, digital | |
| `catalogo` | (sin modo) | |
| `visor-cfdi` | (sin modo) | |
| `nombres` | general, tiendas, ropa, restaurante, polleria, barberia, salon-de-belleza, comida-rapida, variedades | `"opciones": { "textos": { "ligaDominio": "id:buscar-dominio" } }` pinta «Ver si está libre» en cada nombre que cabe como dominio y abre `buscar-dominio?dominio=…`. Puesto en las 9 páginas de nombres: sale sólo cuando `buscar-dominio` esté publicada. |
| `slogan` | general y los mismos giros de `nombres` | El giro se cambia dentro del motor. |
| `texto-legal` | aviso-privacidad (integral y simplificado), terminos, devoluciones | LFPDPPP nueva (DOF 20-03-2025, reforma 14-11-2025) y LFPC (reforma 12-12-2025) leídas en diputados.gob.mx el 12-nov. No deja copiar ni bajar si faltan nombre, domicilio o correo. Revisar las leyes en cada `revisada`. |
| `firma-correo` | (sin modo), gmail, outlook | El modo sólo abre primero los pasos de ese correo. |
| `favicon` | (sin modo) | |
| `lector-qr` | camara (o lector), wifi | Carga `js/vendor/jsQR.min.js` (Apache-2.0) sólo si el navegador no lee QR solo. |
| `dominio-disponible` | (sin modo) | Única herramienta con red: RDAP y DNS sobre HTTPS desde el navegador. Acepta `?dominio=`. Su `textos.cierre` dice que la landing ya trae dominio. |

Eventos: todos disparan `aliviane:resultado` (con `avisar()` de `_comun.js`) al copiar o bajar. Además `lector-qr`
avisa `leer` al leer un código, `visor-cfdi` avisa `leer` al abrir una factura y `dominio-disponible` avisa `consultar`
al terminar una búsqueda. El aviso suave de venta sale con cualquier acción de `ACCIONES_AVISO` en `lib.mjs`
(descargar, copiar, leer, consultar). `probar.mjs` truena si un motor usado no avisa nunca o avisa una acción que
no está en esa lista: un motor nuevo que dé su resultado de otra forma agrega su acción ahí.

## Reglas de escritura que las pruebas barren

Frases de 8 a 15 palabras (truena > 25, avisa si más de 20% pasan de 15), una coma por frase (truena con 3 o más),
sin punto y coma, sin raya larga, sin signos de admiración, sin dos puntos en el bloque de venta, sin markdown literal.
Palabras prohibidas: «aquí podrás», «en esta sección», «solución que permite», «simple», «transparente», «sin
sorpresas», «no te preocupes», «lo honesto», «sin rodeos», «con sinceridad», «sin letras chicas», «te llamamos»…
Nunca el stack (supabase, anthropic, claude, stripe, netlify, resend, aws, github, codex…). Nada en inglés suelto en el
texto visible. Nunca prometer posición en Google, clientes ni ventas. Tuteo («tú») en todas las fijas.
Cifras con `%` o «millones» piden `fuentes`. Al menos 60% propio: truena si comparte más de 40% de sus frases de
5 palabras con otra página. Largo del texto propio (respuesta + cuerpo + preguntas, sin venta):

| Molde | Palabras |
|---|---|
| herramienta | 500-1,000 |
| guia | 1,500-2,800 |
| servicio | 1,300-2,000 |
| por-giro, por-ciudad | 900-1,500 |
| plantilla | 1,100-2,000 |
| comparativa | 1,400-2,400 |

En borradores el largo es aviso; publicado es error. Presupuesto de peso: HTML servido ≤ 60 KB, JS en línea ≤ 60 KB,
cada motor `js/herramientas/*.js` ≤ 60 KB sin contar `js/vendor/`.

## Cómo se llena un lote

1. Elige ids de `fijas/lista.json` (por prioridad) y corre `node fijas/nueva.mjs <id> <id> …`.
2. Lee el top 3 de la cabeza (WebSearch standard; WebFetch para cabezas de 10K o más) y anótalo en `serp`.
3. Llena el JSON siguiendo el molde de su tipo (MOLDE 2.2). Copia la forma de las muestras:
   `generador-de-qr` (herramienta), `como-crear-una-pagina-web` (guía), `diseno-de-paginas-web` (servicio),
   `formato-de-cotizacion` (plantilla), `publicidad-para-unas` (por giro), `precios-de-wix` (comparativa).
4. `node fijas/probar.mjs --estricto` hasta 0 errores.
5. Con el candado de CONSTRUCCION.md: `nice -n 10 node fijas/generar.mjs --borradores ~/material/planificador-2026-11/aliviane/muestras_html`
   y revísalas con `python3 -m http.server -d <dir>` (los módulos no cargan desde `file://`).
6. `node fijas/generar.mjs` (sin bandera) en el repo: con todo en borrador no cambia nada. Commit y push por lote.

## Cómo se publica (decisión de Diego)

Pon `publicacion: 'AAAA-MM-DD'` en las páginas aprobadas (con 3 hermanas publicadas cada una y su motor existente),
corre pruebas y `node fijas/generar.mjs`, y haz commit de las carpetas generadas, `sitemap.xml`, `index.html` (la
sección entre `<!-- fijas:inicio -->` y `<!-- fijas:fin -->`) y `fijas/generadas.json`. Después: Search Console,
IndexNow a Bing y, si quieres una tarjeta propia en WhatsApp, `node fijas/og.mjs --pagina <id>`.
