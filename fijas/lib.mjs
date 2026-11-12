// Piezas comunes del generador de páginas fijas de Aliviane (generar.mjs y probar.mjs).
// Sin dependencias: sólo Node. Ver fijas/CONTRATO.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIR_PAGINAS = path.join(RAIZ, 'fijas', 'paginas');
export const SITIO = 'https://www.aliviane.mx';
export const WHATSAPP = '523111223365';
export const CORREO = 'diego@aliviane.mx';
export const PAGO_LANDING = 'https://buy.stripe.com/8x200beC2ajB6Uu7CX0oM02';
export const PRECIO = { landing: 1500, mensual: 99, sitio: 5000 };

export const MOLDES = ['herramienta', 'guia', 'servicio', 'por-giro', 'por-ciudad', 'plantilla', 'comparativa'];
export const CARPETA = { herramienta: 'herramientas', guia: 'guias', servicio: '', plantilla: 'plantillas',
  comparativa: 'comparar', 'por-giro': 'paginas-web', 'por-ciudad': 'diseno-web' };
// Índices de colección (sólo existen con al menos una página publicada de su molde).
export const COLECCIONES = {
  herramientas: { molde: 'herramienta', nombre: 'Herramientas', h1: 'Herramientas gratis para tu negocio',
    title: 'Herramientas gratis para tu negocio | Aliviane',
    description: 'Generador de QR, link de WhatsApp, logos, paletas y formatos para tu negocio. Todo gratis, sin registro y sin marca de agua. Úsalas desde el celular.',
    intro: 'Herramientas que trabajan en tu navegador. No piden cuenta ni ponen marca de agua.' },
  guias: { molde: 'guia', nombre: 'Guías', h1: 'Guías para la página de tu negocio',
    title: 'Guías para la página web de tu negocio | Aliviane',
    description: 'Guías cortas para negocios en México. Cómo hacer tu página, qué es un dominio, cómo salir en Google y cómo vender por WhatsApp. Con pasos y ejemplos.',
    intro: 'Pasos y ejemplos para que tu negocio se vea bien en internet.' },
  plantillas: { molde: 'plantilla', nombre: 'Plantillas', h1: 'Plantillas y formatos gratis',
    title: 'Plantillas y formatos gratis para negocios | Aliviane',
    description: 'Formatos de cotización, recibos, ejemplos de páginas y plantillas para redes. Llénalos en línea y descárgalos en PDF sin dejar tu correo ni crear cuenta.',
    intro: 'Formatos listos para llenar y descargar sin dejar tu correo.' },
};
// Carpetas y archivos que ya existen en la raíz: ninguna página puede usar estos nombres.
export const RESERVADAS = ['sitios', 'img', 'netlify', 'js', 'css', 'fijas', 'node_modules', 'v', 'index.html', '404.html',
  'robots.txt', 'sitemap.xml', 'package.json', 'README.md', 'herramientas', 'guias', 'plantillas', 'comparar', 'paginas-web',
  'diseno-web', 'admin', 'api', '.netlify', '.github'];

export const TRABAJOS = {
  laola: { nombre: 'La Ola', url: 'laola.mx', texto: 'Menú, eventos y lealtad de cuatro sucursales' },
  comprafin: { nombre: 'Comprafin', url: 'comprafin.com', texto: 'Precios del día de cada proveedor en una tabla' },
  makatea: { nombre: 'Makatea', url: 'makatea.ai', texto: 'Recordatorios de pago por WhatsApp' },
  signsolu: { nombre: 'SignSolú', url: 'signsolu.com', texto: 'Contratos que se firman desde el celular' },
  agroqs: { nombre: 'Agroqs', url: 'agroqs.com', texto: 'Cotizaciones con su marca en minutos' },
  avelina: { nombre: 'Avelina', url: 'avelina.com.mx', texto: 'Un sitio con la personalidad de la artista' },
  solu: { nombre: 'Solú', url: 'solufintech.com', texto: 'Solicitud de crédito desde el celular' },
  pilsi: { nombre: 'Pilsi', url: 'pilsi.art', texto: 'Directorio de talento creativo' },
};
export const TRABAJOS_DEFECTO = ['laola', 'comprafin', 'makatea'];

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const mesAnio = (am) => { const [a, m] = am.split('-'); return `${MESES[+m - 1]} de ${a}`; };

export function cargarPaginas() {
  if (!fs.existsSync(DIR_PAGINAS)) return [];
  return fs.readdirSync(DIR_PAGINAS).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const p = JSON.parse(fs.readFileSync(path.join(DIR_PAGINAS, f), 'utf8'));
    p._archivo = f;
    return p;
  });
}

export const ruta = (p) => '/' + (CARPETA[p.molde] ? CARPETA[p.molde] + '/' : '') + p.slug + '/';
export const publicada = (p, hoy) => !!p.publicacion && p.publicacion <= hoy;
export const hoyCDMX = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
export const motorExiste = (id) => !!id && fs.existsSync(path.join(RAIZ, 'js', 'herramientas', id + '.js'));

// Todo lo que un motor carga (relativo a la raíz del repo), siguiendo sus import, import() y
// new URL('…', import.meta.url). Una ruta armada con ${…} cuenta como su carpeta («fuentes/»).
// La página además liga /css/herramientas.css. Devuelve { archivos, carpetas, faltan }.
export function dependenciasMotor(id) {
  const archivos = new Set(['css/herramientas.css']), carpetas = new Set(), faltan = new Set();
  const pendientes = [`js/herramientas/${id}.js`];
  const RE = [/\bfrom\s*['"](\.{1,2}\/[^'"]+)['"]/g, /\bimport\s*\(\s*['"`](\.{1,2}\/[^'"`]+)['"`]\s*\)/g,
    /new URL\(\s*(['"`])([^'"`]+)\1\s*,\s*import\.meta\.url/g];
  while (pendientes.length) {
    const rel = pendientes.pop();
    if (archivos.has(rel)) continue;
    archivos.add(rel);
    const abs = path.join(RAIZ, rel);
    if (!fs.existsSync(abs)) { faltan.add(rel); continue; }
    if (!rel.endsWith('.js')) continue;
    const src = fs.readFileSync(abs, 'utf8');
    for (const re of RE) for (const m of src.matchAll(re)) {
      const ref = m[2] ?? m[1];
      if (ref.includes('${')) {
        const dir = path.posix.normalize(path.posix.join(path.posix.dirname(rel), ref.slice(0, ref.indexOf('${')).replace(/[^/]*$/, '')));
        carpetas.add(dir.replace(/\/?$/, '/'));
        if (!fs.existsSync(path.join(RAIZ, dir))) faltan.add(dir + '/');
        continue;
      }
      const dest = path.posix.normalize(path.posix.join(path.posix.dirname(rel), ref.split(/[?#]/)[0]));
      if (!archivos.has(dest)) pendientes.push(dest);
    }
  }
  for (const f of archivos) if (!fs.existsSync(path.join(RAIZ, f))) faltan.add(f);
  return { archivos: [...archivos].sort(), carpetas: [...carpetas].sort(), faltan: [...faltan].sort() };
}

// Lo que el workflow publica: lo que git rastrea, menos fijas/, README.md, CNAME y .github/ (ver .github/workflows/netlify.yml).
let _publicables = null;
export function archivosPublicables() {
  if (_publicables) return _publicables;
  let lista = [];
  try { lista = execFileSync('git', ['-C', RAIZ, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 << 20 }).split('\0').filter(Boolean); } catch (e) { lista = []; }
  _publicables = new Set(lista.filter((f) => !/^(README\.md|CNAME|\.github\/.*|fijas\/.*)$/.test(f)));
  return _publicables;
}
// Lo que un motor necesita y no se publicaría (no rastreado por git o excluido del workflow).
export function dependenciasSinPublicar(id) {
  const pub = archivosPublicables();
  const { archivos, carpetas } = dependenciasMotor(id);
  const fuera = archivos.filter((f) => !pub.has(f));
  for (const d of carpetas) {
    const enDisco = fs.existsSync(path.join(RAIZ, d)) ? fs.readdirSync(path.join(RAIZ, d)).map((f) => d + f) : [];
    if (!enDisco.length) fuera.push(d);
    for (const f of enDisco) if (!pub.has(f)) fuera.push(f);
  }
  return fuera;
}

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const tituloFinal = (p) => (p.title + ' | Aliviane').length <= 58 ? p.title + ' | Aliviane' : p.title;
export const largo = (s) => [...String(s || '')].length;

// Mensaje de WhatsApp con el origen de la página.
export function ligaWhatsApp(p) {
  const tema = p.venta?.tema || p.h1;
  const texto = p.venta?.mensaje || `Hola, vi la página «${tema}» en aliviane.mx y quiero una página web para mi negocio. (ref f-${p.slug})`;
  const final = texto.includes(`f-${p.slug}`) ? texto : `${texto} (ref f-${p.slug})`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(final)}`;
}
export const ligaPortada = (p, ancla = '') => `/?c=f-${p.slug}${ancla}`;

// Contexto de un render: qué existe y en qué modo.
export function contexto(paginas, { borradores = false, hoy = hoyCDMX() } = {}) {
  const visibles = paginas.filter((p) => borradores || publicada(p, hoy));
  const porId = new Map(paginas.map((p) => [p.id, p]));
  const visibleId = new Set(visibles.map((p) => p.id));
  const indices = {};
  for (const [carpeta, c] of Object.entries(COLECCIONES)) {
    const items = visibles.filter((p) => p.molde === c.molde);
    if (items.length) indices[carpeta] = { ...c, carpeta, items };
  }
  return { borradores, hoy, paginas, visibles, porId, visibleId, indices };
}

// Texto en línea: **negrita** y [texto](/ruta) o [texto](id:otra-pagina).
export function md(s, ctx) {
  let t = esc(s);
  t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => {
    if (url.startsWith('id:')) {
      const q = ctx.porId.get(url.slice(3));
      if (!q || !ctx.visibleId.has(q.id)) return txt;
      return `<a href="${ruta(q)}">${txt}</a>`;
    }
    const ext = /^https?:/.test(url);
    return `<a href="${url}"${ext ? ' target="_blank" rel="noopener"' : ''}>${txt}</a>`;
  });
  return t;
}

const CSS = `.ah-herramienta:empty{min-height:var(--reserva,900px)}:root{--negro:#0b0b0b;--negro-2:#141414;--negro-3:#1c1c1c;--crema:#f2f2f0;--texto:#d6d6d3;--gris:#8c8c8c;--gris-2:#4d4d4d;--sans:"Schibsted Grotesk","Helvetica Neue",Arial,sans-serif;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--negro);color:var(--texto);font:400 17px/1.65 var(--sans);-webkit-font-smoothing:antialiased}
a{color:var(--crema)}img{display:block;max-width:100%;height:auto}
.ancho{width:min(760px,100% - 32px);margin-inline:auto}.ancho-h{width:min(1040px,100% - 32px);margin-inline:auto}.lectura{max-width:760px}
.barra{padding:20px 0}.barra .ancho-h{display:flex;align-items:center;justify-content:space-between;gap:20px}
.marca{font:700 21px/1 var(--sans);letter-spacing:-.03em;display:inline-flex;align-items:center;gap:4px;color:var(--crema);text-decoration:none}.marca svg{width:28px;height:28px;margin-left:-4px}
.barra nav{display:flex;gap:22px;font-size:15px}.barra nav a{color:var(--gris);text-decoration:none}.barra nav a:hover{color:var(--crema)}
.migas{font-size:14px;color:var(--gris);margin:28px 0 18px}.migas a{color:var(--gris);text-decoration:none}.migas a:hover{color:var(--crema)}
h1{font-weight:500;font-size:clamp(36px,6vw,64px);line-height:1.02;letter-spacing:-.045em;color:var(--crema);margin:0 0 22px}
h2{font-weight:500;font-size:clamp(26px,3.4vw,36px);line-height:1.1;letter-spacing:-.035em;color:var(--crema);margin:64px 0 18px}
h3{font-weight:500;font-size:21px;letter-spacing:-.02em;color:var(--crema);margin:36px 0 10px}
.respuesta p{font-size:19px;color:var(--crema);margin:0 0 14px}.fecha{font-size:14px;color:var(--gris);margin:0 0 26px}
p{margin:0 0 16px}ul,ol{padding-left:22px;margin:0 0 18px}li{margin:0 0 8px}b{color:var(--crema);font-weight:600}
.tabla{overflow-x:auto;margin:8px 0 22px}table{border-collapse:collapse;width:100%;font-size:15px}th{text-align:left;font-weight:500;color:var(--crema);background:var(--negro-3)}th,td{padding:12px 14px;vertical-align:top}tbody tr:nth-child(even){background:var(--negro-2)}
.pasos{list-style:none;padding:0;counter-reset:p;display:grid;gap:22px}.pasos li{counter-increment:p;margin:0}.pasos li::before{content:counter(p,decimal-leading-zero);display:block;color:var(--gris);font-size:14px;margin-bottom:6px}.pasos b{display:block;font-size:19px;font-weight:500;margin-bottom:4px}
.herramienta-zona{margin:30px 0 10px}.ah-hueco{border:1px dashed var(--gris-2);border-radius:6px;padding:48px 20px;text-align:center;color:var(--gris)}
.aviso{background:var(--negro-2);border-radius:6px;padding:18px 20px;margin:18px 0 0}.aviso p{margin:0}
details{padding:18px 0}summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:20px;font-size:19px;color:var(--crema)}summary::-webkit-details-marker{display:none}summary::after{content:"+";color:var(--gris);font-size:24px;line-height:1}details[open] summary::after{content:"−"}details p{margin:12px 0 0;max-width:40em}
.venta{background:var(--negro-2);border-radius:8px;padding:clamp(22px,4vw,40px);margin:64px 0}.venta h2{margin-top:0}.venta .puente{font-size:19px;color:var(--crema)}
.precio-linea{font-size:17px}.precio-linea b{font-size:30px;font-weight:500;letter-spacing:-.03em;margin-right:6px}
.acciones{display:flex;flex-wrap:wrap;align-items:center;gap:14px 24px;margin:22px 0 4px}
.boton{display:inline-block;background:var(--crema);color:var(--negro);padding:14px 22px;border-radius:4px;font-weight:600;font-size:16px;text-decoration:none}
.liga{color:var(--crema);text-decoration:none;border-bottom:1px solid var(--gris-2);padding-bottom:2px;font-weight:500}
.alterno{font-size:15px;color:var(--gris);margin:16px 0 0}
.trabajos{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:26px 0 6px}.trabajos figure{margin:0}
.ventana{border:1px solid #2c2c2c;border-radius:6px;overflow:hidden;background:#fff}.ventana-barra{display:flex;justify-content:space-between;padding:6px 10px;font-size:11px;color:#555;background:#e9e9e7}.ventana-barra span:last-child{letter-spacing:6px}
.trabajos figcaption{font-size:14px;color:var(--gris);margin-top:8px}.trabajos figcaption b{display:block;font-weight:500}
.relacionadas{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;padding:0;list-style:none}.relacionadas a{display:block;padding:16px 18px;background:var(--negro-2);border-radius:6px;text-decoration:none;color:var(--crema)}.relacionadas a span{display:block;font-size:14px;color:var(--gris);margin-top:4px}
.fuentes{font-size:14px;color:var(--gris)}.fuentes a{color:var(--gris)}
footer{padding:48px 0 56px;color:var(--gris);font-size:14px}footer a{color:var(--gris)}footer nav{display:flex;flex-wrap:wrap;gap:8px 20px;margin-bottom:12px}
@media(max-width:720px){.barra nav{gap:14px;font-size:14px}.barra nav .opc{display:none}.trabajos{grid-template-columns:1fr 1fr}.trabajos figure:nth-child(3){display:none}h2{margin-top:52px}}`;

const LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="16.5" y="20" width="25" height="26" rx="8" fill="none" stroke="currentColor" stroke-width="7"/><rect x="38" y="16.5" width="7.5" height="33" rx="1" fill="currentColor"/></svg>';

function cabecera(ctx, origen) {
  const c = origen ? `?c=f-${origen}` : '';
  const ligas = [];
  if (ctx.indices.herramientas) ligas.push(`<a href="/herramientas/">Herramientas</a>`);
  if (ctx.indices.guias) ligas.push(`<a class="opc" href="/guias/">Guías</a>`);
  ligas.push(`<a href="/${c}#trabajos">Trabajos</a>`, `<a class="opc" href="/${c}#paquetes">Precios</a>`);
  return `<header class="barra"><div class="ancho-h"><a class="marca" href="/${c}" aria-label="Aliviane, inicio">${LOGO}aliviane</a><nav>${ligas.join('')}</nav></div></header>`;
}

function pie(ctx, origen) {
  const c = origen ? `?c=f-${origen}` : '';
  const ligas = Object.values(ctx.indices).map((i) => `<a href="/${i.carpeta}/">${i.nombre}</a>`);
  ligas.push(`<a href="/${c}#paquetes">Precios</a>`, `<a href="mailto:${CORREO}">${CORREO}</a>`);
  return `<footer><div class="ancho"><nav>${ligas.join('')}</nav><p>Aliviane · Páginas web para negocios en México</p></div></footer>`;
}

function head({ titulo, descripcion, canon, og, ld, noindex }) {
  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${canon}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta name="theme-color" content="#0b0b0b">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="es_MX">
<meta property="og:site_name" content="Aliviane">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/icono.svg?v=2" type="image/svg+xml">
<link rel="icon" href="/img/favicon-32.png?v=2" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png?v=2">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>`;
}

export function imagenOg(p) {
  const propia = path.join(RAIZ, 'img', 'og', p.id + '.png');
  return `${SITIO}/img/og/${fs.existsSync(propia) ? p.id : p.molde}.png`;
}

// ---------- Bloques del cuerpo ----------
function bloque(b, p, ctx) {
  if (b.h2) return `<h2>${md(b.h2, ctx)}</h2>`;
  if (b.h3) return `<h3>${md(b.h3, ctx)}</h3>`;
  if (b.p) return `<p>${md(b.p, ctx)}</p>`;
  if (b.ul) return `<ul>${b.ul.map((x) => `<li>${md(x, ctx)}</li>`).join('')}</ul>`;
  if (b.ol) return `<ol>${b.ol.map((x) => `<li>${md(x, ctx)}</li>`).join('')}</ol>`;
  if (b.pasos) return `<ol class="pasos">${b.pasos.map((x) => `<li><b>${md(x.titulo, ctx)}</b>${md(x.texto, ctx)}</li>`).join('')}</ol>`;
  if (b.tabla) {
    const t = b.tabla;
    return `<div class="tabla"><table>${t.titulo ? `<caption class="fecha">${md(t.titulo, ctx)}</caption>` : ''}<thead><tr>${t.columnas.map((c) => `<th>${md(c, ctx)}</th>`).join('')}</tr></thead><tbody>${t.filas.map((f) => `<tr>${f.map((c) => `<td>${md(c, ctx)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  if (b.venta) return venta(p, ctx, { corta: true });
  if (b.trabajos) return trabajos(p);
  throw new Error(`${p.id}: bloque desconocido ${JSON.stringify(b).slice(0, 80)}`);
}

function trabajos(p) {
  const ids = (p.venta?.trabajos?.length ? p.venta.trabajos : TRABAJOS_DEFECTO).slice(0, 3);
  return `<div class="trabajos">${ids.map((id) => {
    const t = TRABAJOS[id];
    if (!t) throw new Error(`${p.id}: trabajo desconocido ${id}`);
    return `<figure><div class="ventana"><div class="ventana-barra"><span>${t.url}</span><span aria-hidden="true">─□✕</span></div><img src="/img/trabajos/chico/${id}.jpg" alt="Página de ${esc(t.nombre)} en computadora" width="720" height="450" loading="lazy" decoding="async"></div><figcaption><b>${esc(t.nombre)}</b>${esc(t.texto)}</figcaption></figure>`;
  }).join('')}</div>`;
}

// El bloque de venta (MOLDE_FIJAS 2.1). corta = a media página o arriba: sin trabajos.
export function venta(p, ctx, { corta = false, id = '' } = {}) {
  const v = p.venta || {};
  const titulo = corta ? (v.tituloCorto || 'Tu página web con dominio incluido') : (v.titulo || '¿Hacemos la página de tu negocio?');
  const precio = `<p class="precio-linea"><b>$1,500</b> con tu dominio incluido. Después $99 al mes con hosting y cambios cada semana.</p>`;
  const pagar = !corta && ['servicio', 'por-giro', 'por-ciudad'].includes(p.molde)
    ? `<a class="liga" href="${PAGO_LANDING}" target="_blank" rel="noopener">Pagar mi landing</a>` : '';
  return `<section class="venta"${id ? ` id="${id}"` : ''} data-venta>
<h2>${esc(titulo)}</h2>
<p class="puente">${md(v.puente, ctx)}</p>
${precio}
${corta ? '' : trabajos(p)}
<div class="acciones"><a class="boton" href="${ligaWhatsApp(p)}" target="_blank" rel="noopener">Escribir por WhatsApp</a><a class="liga" href="${ligaPortada(p, '#trabajos')}">Ver ejemplos</a>${pagar}</div>
${corta ? '' : `<p class="alterno">También por correo a <a href="mailto:${CORREO}?subject=${encodeURIComponent('Página web (ref f-' + p.slug + ')')}">${CORREO}</a>. Te mandamos una muestra antes de que pagues.</p>`}
</section>`;
}

// Acciones de un motor que cuentan como «ya tiene su resultado» y muestran el aviso suave de venta.
// Todos los motores las mandan con avisar() de js/herramientas/_comun.js en el evento «aliviane:resultado».
export const ACCIONES_AVISO = ['descargar', 'copiar', 'leer', 'consultar'];

// Opciones extra del motor desde la página (`herramienta.opciones`, llegan a montar() junto con modo e idioma).
// Un texto «id:<página>» se vuelve la ruta de esa página sólo si está visible en este render (publicada; en
// borradores, si existe). Si no, se vuelve '' y el motor apaga esa liga (p. ej. textos.ligaDominio de nombres).
export function opcionesMotor(p, ctx) {
  const resolver = (v) => {
    if (typeof v === 'string' && v.startsWith('id:')) {
      const q = ctx.porId.get(v.slice(3));
      return q && ctx.visibleId.has(q.id) ? ruta(q) : '';
    }
    if (Array.isArray(v)) return v.map(resolver);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolver(x)]));
    return v;
  };
  return resolver(p.herramienta?.opciones || {});
}

const RESERVA_MOTOR = { 'visor-cfdi': 270, 'lector-qr': 260, 'dominio-disponible': 360 };
function herramienta(p, ctx) {
  const h = p.herramienta;
  if (!h?.id) return '';
  const existe = motorExiste(h.id);
  if (!existe) {
    if (!ctx.borradores) throw new Error(`${p.id}: el motor js/herramientas/${h.id}.js no existe; no se puede publicar`);
    return `<div class="herramienta-zona"><div class="ah-herramienta ah-hueco" data-herramienta="${esc(h.id)}" data-modo="${esc(h.modo || '')}"><p>La herramienta aparece aquí.</p></div></div>`;
  }
  const opciones = JSON.stringify({ ...opcionesMotor(p, ctx), modo: h.modo || undefined, idioma: 'es-MX' }).replace(/</g, '\\u003c');
  // Alto reservado mientras el motor monta: evita que el texto de abajo salte (CLS). Los motores chicos reservan su alto real.
  const reserva = RESERVA_MOTOR[h.id] ? ` style="--reserva:${RESERVA_MOTOR[h.id]}px"` : '';
  return `<div class="herramienta-zona"><link rel="stylesheet" href="/css/herramientas.css"><div class="ah-herramienta" data-herramienta="${esc(h.id)}" data-modo="${esc(h.modo || '')}"${reserva}></div>
<script type="module">import{montar}from"/js/herramientas/${h.id}.js";montar(document.querySelector('.ah-herramienta'),${opciones});</script></div>
<aside class="aviso" id="aviso-venta" hidden><p>${md(p.venta?.aviso || p.venta?.puente, ctx)} <a href="${ligaWhatsApp(p)}" target="_blank" rel="noopener">Pídela por WhatsApp</a></p></aside>
<script>document.addEventListener('aliviane:resultado',function(e){var a=document.getElementById('aviso-venta');if(a&&e.detail&&${JSON.stringify(ACCIONES_AVISO)}.indexOf(e.detail.accion)>=0)a.hidden=false});</script>`;
}

function faqs(p, ctx) {
  if (!p.faqs?.length) return '';
  return `<h2>Preguntas frecuentes</h2>${p.faqs.map((f) => `<details><summary>${esc(f.pregunta)}</summary><p>${md(f.respuesta, ctx)}</p></details>`).join('')}`;
}

function relacionadas(p, ctx) {
  const items = (p.relacionadas || []).map((id) => ctx.porId.get(id)).filter((q) => q && ctx.visibleId.has(q.id));
  if (!items.length) return '';
  const titulo = p.molde === 'herramienta' ? 'Otras herramientas gratis' : 'También te puede servir';
  return `<h2>${titulo}</h2><ul class="relacionadas">${items.map((q) => `<li><a href="${ruta(q)}">${esc(q.h1)}<span>${esc(q.resumen || q.description.split('. ')[0])}</span></a></li>`).join('')}</ul>`;
}

const textoPlano = (s) => String(s || '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

export function jsonLd(p, ctx) {
  const url = SITIO + ruta(p);
  const migas = [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' }];
  const col = Object.values(ctx.indices).find((i) => i.molde === p.molde);
  if (col) migas.push({ '@type': 'ListItem', position: 2, name: col.nombre, item: `${SITIO}/${col.carpeta}/` });
  migas.push({ '@type': 'ListItem', position: migas.length + 1, name: p.h1, item: url });
  const org = { '@type': 'Organization', '@id': SITIO + '/#aliviane', name: 'Aliviane', url: SITIO + '/', email: CORREO };
  const g = [
    { '@type': 'BreadcrumbList', itemListElement: migas },
    { '@type': 'WebPage', '@id': url, url, name: p.title, description: p.description, inLanguage: 'es-MX',
      datePublished: p.publicacion || p.creada, dateModified: p.actualizado, isPartOf: { '@type': 'WebSite', name: 'Aliviane', url: SITIO + '/' },
      primaryImageOfPage: imagenOg(p) },
  ];
  if (p.faqs?.length) g.push({ '@type': 'FAQPage', mainEntity: p.faqs.map((f) => ({ '@type': 'Question', name: f.pregunta,
    acceptedAnswer: { '@type': 'Answer', text: textoPlano(f.respuesta) } })) });
  if (p.molde === 'herramienta' || p.herramienta?.id) g.push({ '@type': 'WebApplication', name: p.h1, url, applicationCategory: p.categoriaApp || 'BusinessApplication',
    operatingSystem: 'Cualquiera con navegador', inLanguage: 'es-MX', isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'MXN' }, provider: org });
  if (['servicio', 'por-giro', 'por-ciudad'].includes(p.molde)) {
    const area = p.servicio?.ciudad ? { '@type': 'City', name: p.servicio.ciudad } : { '@type': 'Country', name: 'México' };
    g.push({ '@type': 'Service', name: p.servicio?.nombre || p.h1, serviceType: p.servicio?.tipo || 'Diseño de páginas web', provider: org, areaServed: area,
      offers: [{ '@type': 'Offer', name: 'Landing page con dominio incluido', price: String(PRECIO.landing), priceCurrency: 'MXN' },
        { '@type': 'Offer', name: 'Sitio completo', price: String(PRECIO.sitio), priceCurrency: 'MXN' }] });
  }
  return { '@context': 'https://schema.org', '@graph': g };
}

// ---------- Página completa ----------
export function renderPagina(p, ctx) {
  const url = SITIO + ruta(p);
  const col = Object.values(ctx.indices).find((i) => i.molde === p.molde);
  const migas = `<nav class="migas" aria-label="Migas"><a href="${ligaPortada(p)}">Inicio</a>${col ? ` › <a href="/${col.carpeta}/">${col.nombre}</a>` : ''} › <span>${esc(p.h1)}</span></nav>`;
  const fecha = p.revisada ? `<p class="fecha">Revisada en ${mesAnio(p.revisada)}</p>` : '';
  const respuesta = `<div class="respuesta">${(p.respuesta || []).map((x) => `<p>${md(x, ctx)}</p>`).join('')}</div>`;
  const cuerpo = (p.cuerpo || []).map((b) => bloque(b, p, ctx)).join('\n');
  const conVentaArriba = ['servicio', 'por-giro', 'por-ciudad'].includes(p.molde);
  const fuentes = p.fuentes?.length ? `<p class="fuentes">Fuentes: ${p.fuentes.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.texto)}</a>`).join(' · ')}</p>` : '';
  const ancho = p.herramienta?.id ? 'ancho-h' : 'ancho';
  const main = `<main class="${ancho}">${migas}
<h1>${esc(p.h1)}</h1>
${fecha}${respuesta}
${herramienta(p, ctx)}
${conVentaArriba ? venta(p, ctx, { corta: true, id: 'precio' }) : ''}
<div class="${p.herramienta?.id ? 'lectura' : ''}">
${cuerpo}
${faqs(p, ctx)}
${venta(p, ctx, { id: 'contratar' })}
${relacionadas(p, ctx)}
${fuentes}
</div></main>`;
  return `${head({ titulo: tituloFinal(p), descripcion: p.description, canon: url, og: imagenOg(p), ld: jsonLd(p, ctx), noindex: ctx.borradores && !publicada(p, ctx.hoy) })}
<body>
${cabecera(ctx, p.slug)}
${main}
${pie(ctx, p.slug)}
</body>
</html>
`;
}

export function renderIndice(ind, ctx) {
  const url = `${SITIO}/${ind.carpeta}/`;
  const grupos = new Map();
  for (const p of [...ind.items].sort((a, b) => a.h1.localeCompare(b.h1, 'es'))) {
    const k = p.categoria || 'Más';
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(p);
  }
  const orden = [...grupos.keys()].sort((a, b) => (a === 'Más') - (b === 'Más') || a.localeCompare(b, 'es'));
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' }, { '@type': 'ListItem', position: 2, name: ind.nombre, item: url }] },
    { '@type': 'CollectionPage', '@id': url, url, name: ind.title, description: ind.description, inLanguage: 'es-MX',
      mainEntity: { '@type': 'ItemList', itemListElement: ind.items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITIO + ruta(p), name: p.h1 })) } },
  ] };
  const cuerpo = orden.map((k) => `${grupos.size > 1 ? `<h2>${esc(k)}</h2>` : ''}<ul class="relacionadas">${grupos.get(k).map((p) => `<li><a href="${ruta(p)}">${esc(p.h1)}<span>${esc(p.resumen || p.description.split('. ')[0])}</span></a></li>`).join('')}</ul>`).join('\n');
  return `${head({ titulo: ind.title, descripcion: ind.description, canon: url, og: `${SITIO}/img/og/${ind.molde}.png`, ld, noindex: ctx.borradores })}
<body>
${cabecera(ctx, ind.carpeta)}
<main class="ancho"><nav class="migas" aria-label="Migas"><a href="/?c=f-${ind.carpeta}">Inicio</a> › <span>${ind.nombre}</span></nav>
<h1>${esc(ind.h1)}</h1>
<div class="respuesta"><p>${esc(ind.intro)}</p></div>
${cuerpo}
</main>
${pie(ctx, ind.carpeta)}
</body>
</html>
`;
}

// Sección discreta de la portada (entre marcadores). Vacía si no hay nada publicado.
export const MARCA_INI = '<!-- fijas:inicio (lo escribe fijas/generar.mjs) -->';
export const MARCA_FIN = '<!-- fijas:fin -->';
export function seccionPortada(ctx) {
  const ligas = Object.values(ctx.indices).map((i) => `<a href="/${i.carpeta}/" style="border-bottom:1px solid #4d4d4d;padding-bottom:2px">${i.nombre} gratis</a>`);
  for (const p of ctx.visibles.filter((q) => ['servicio', 'por-giro', 'por-ciudad', 'comparativa'].includes(q.molde)))
    ligas.push(`<a href="${ruta(p)}" style="border-bottom:1px solid #4d4d4d;padding-bottom:2px">${esc(p.h1)}</a>`);
  if (!ligas.length) return '';
  return `<section class="fijas-ligas" style="padding:40px 0 0"><div class="ancho" style="display:flex;flex-wrap:wrap;gap:12px 28px;font-size:15px;color:#8c8c8c">${ligas.join('')}</div></section>`;
}

// Texto visible de un HTML (para las pruebas).
export function textoVisible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<head>[\s\S]*?<\/head>/, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
}

// Texto propio de la página (sin bloque de venta ni plantilla): respuesta, cuerpo y preguntas.
export function textoPropio(p) {
  const partes = [...(p.respuesta || [])];
  for (const b of p.cuerpo || []) {
    for (const k of ['h2', 'h3', 'p']) if (b[k]) partes.push(b[k]);
    for (const k of ['ul', 'ol']) if (b[k]) partes.push(...b[k]);
    if (b.pasos) for (const x of b.pasos) partes.push(x.titulo + '. ' + x.texto);
    if (b.tabla) { partes.push(...b.tabla.columnas); for (const f of b.tabla.filas) partes.push(...f); }
  }
  for (const f of p.faqs || []) partes.push(f.pregunta, f.respuesta);
  return partes.map(textoPlano).join('\n');
}
export const palabras = (s) => (String(s).match(/[\p{L}\p{N}$%][\p{L}\p{N},.$%'-]*/gu) || []).length;
