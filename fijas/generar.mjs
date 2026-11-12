#!/usr/bin/env node
// Generador de las páginas fijas de Aliviane. Ver fijas/CONTRATO.md.
//
//   node fijas/generar.mjs                      escribe en el repo SÓLO lo publicado (publicacion <= hoy CDMX):
//                                               <carpeta>/<slug>/index.html, índices, sitemap.xml y la sección
//                                               de ligas de la portada (entre marcadores). Borra lo que dejó de estar publicado.
//   node fijas/generar.mjs --borradores <dir>   escribe TODO (borradores incluidos, con noindex) en <dir>, fuera del
//                                               repo, con copia de img/js/css para revisarlo con un servidor local.
//   --hoy AAAA-MM-DD                            fecha de corte (por omisión, hoy en CDMX).
//
// Corre las pruebas antes: node fijas/probar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, SITIO, COLECCIONES, cargarPaginas, contexto, renderPagina, renderIndice, ruta, hoyCDMX,
  seccionPortada, MARCA_INI, MARCA_FIN } from './lib.mjs';

const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const dirBorradores = val('--borradores');
const hoy = val('--hoy') || hoyCDMX();

const paginas = cargarPaginas();
const ctx = contexto(paginas, { borradores: !!dirBorradores, hoy });

function escribir(base, rel, contenido) {
  const f = path.join(base, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, contenido);
  return rel;
}

if (dirBorradores) {
  const base = path.resolve(dirBorradores);
  if (base === RAIZ || base.startsWith(RAIZ + path.sep)) { console.error('--borradores debe ser un directorio fuera del repo'); process.exit(1); }
  fs.mkdirSync(base, { recursive: true });
  for (const p of ctx.visibles) escribir(base, ruta(p).slice(1) + 'index.html', renderPagina(p, ctx));
  for (const ind of Object.values(ctx.indices)) escribir(base, ind.carpeta + '/index.html', renderIndice(ind, ctx));
  // Lo que las páginas cargan, para verlas con un servidor local (python3 -m http.server -d <dir>).
  for (const rel of ['img', 'js', 'css', 'index.html']) {
    const o = path.join(RAIZ, rel);
    if (fs.existsSync(o)) fs.cpSync(o, path.join(base, rel), { recursive: true });
  }
  console.log(`borradores: ${ctx.visibles.length} páginas y ${Object.keys(ctx.indices).length} índices en ${base}`);
  process.exit(0);
}

// ---------- Modo repo: sólo lo publicado ----------
const MANIFIESTO = path.join(RAIZ, 'fijas', 'generadas.json');
const antes = fs.existsSync(MANIFIESTO) ? JSON.parse(fs.readFileSync(MANIFIESTO, 'utf8')) : [];
const ahora = [];
for (const p of ctx.visibles) ahora.push(escribir(RAIZ, ruta(p).slice(1) + 'index.html', renderPagina(p, ctx)));
for (const ind of Object.values(ctx.indices)) ahora.push(escribir(RAIZ, ind.carpeta + '/index.html', renderIndice(ind, ctx)));

// Borra lo que se generó antes y ya no está publicado (sólo index.html dentro de carpetas de fijas).
const permitidas = new Set(['herramientas', 'guias', 'plantillas', 'comparar', 'paginas-web', 'diseno-web', ...paginas.filter((p) => p.molde === 'servicio').map((p) => p.slug)]);
for (const rel of antes) {
  if (ahora.includes(rel)) continue;
  if (!rel.endsWith('/index.html') || !permitidas.has(rel.split('/')[0])) continue;
  const f = path.join(RAIZ, rel);
  if (fs.existsSync(f)) { fs.unlinkSync(f); let d = path.dirname(f); while (d !== RAIZ && fs.readdirSync(d).length === 0) { fs.rmdirSync(d); d = path.dirname(d); } }
}
fs.writeFileSync(MANIFIESTO, JSON.stringify(ahora.sort(), null, 1) + '\n');

// sitemap.xml: conserva las URLs que no son fijas (la portada) y agrega índices y páginas publicadas.
const SITEMAP = path.join(RAIZ, 'sitemap.xml');
const viejo = fs.readFileSync(SITEMAP, 'utf8');
const rutasFijas = new Set([...paginas.map((p) => SITIO + ruta(p)), ...Object.keys(COLECCIONES).map((c) => `${SITIO}/${c}/`)]);
const conservar = (viejo.match(/<url>[\s\S]*?<\/url>/g) || []).filter((u) => !rutasFijas.has((u.match(/<loc>([^<]+)<\/loc>/) || [])[1]));
const nuevas = [];
for (const ind of Object.values(ctx.indices)) {
  const lm = ind.items.map((p) => p.actualizado).sort().pop();
  nuevas.push(`<url><loc>${SITIO}/${ind.carpeta}/</loc><lastmod>${lm}</lastmod></url>`);
}
for (const p of [...ctx.visibles].sort((a, b) => ruta(a).localeCompare(ruta(b)))) nuevas.push(`<url><loc>${SITIO}${ruta(p)}</loc><lastmod>${p.actualizado}</lastmod></url>`);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...conservar, ...nuevas].map((u) => '  ' + u).join('\n')}\n</urlset>\n`;
if (sitemap !== viejo) fs.writeFileSync(SITEMAP, sitemap);

// Portada: sección de ligas entre marcadores, sólo si hay algo publicado.
const PORTADA = path.join(RAIZ, 'index.html');
const portada = fs.readFileSync(PORTADA, 'utf8');
const seccion = seccionPortada(ctx);
let nueva = portada;
const i = portada.indexOf(MARCA_INI), j = portada.indexOf(MARCA_FIN);
if (i >= 0 && j > i) {
  const resto = portada.slice(j + MARCA_FIN.length);
  nueva = seccion ? portada.slice(0, i) + `${MARCA_INI}\n${seccion}\n${MARCA_FIN}` + resto : portada.slice(0, i) + resto.replace(/^\n/, '');
} else if (seccion) nueva = portada.replace('<footer>', `${MARCA_INI}\n${seccion}\n${MARCA_FIN}\n<footer>`);
if (nueva !== portada) fs.writeFileSync(PORTADA, nueva);

console.log(`publicadas: ${ctx.visibles.length} de ${paginas.length} · índices: ${Object.keys(ctx.indices).join(', ') || 'ninguno'} · corte ${hoy}`);
console.log(`sitemap ${sitemap === viejo ? 'sin cambios' : 'actualizado'} · portada ${nueva === portada ? 'sin cambios' : 'actualizada'}`);
