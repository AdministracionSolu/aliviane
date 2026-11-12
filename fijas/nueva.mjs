#!/usr/bin/env node
// Lista del plan y esqueletos de página. Ver fijas/CONTRATO.md.
//   node fijas/nueva.mjs --importar <LISTA_CONSTRUIR.csv>   copia la lista depurada a fijas/lista.json
//   node fijas/nueva.mjs <id> [<id> ...]                      crea fijas/paginas/<id>.json (borrador vacío) desde la lista
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, DIR_PAGINAS, hoyCDMX } from './lib.mjs';

const LISTA = path.join(RAIZ, 'fijas', 'lista.json');
export const CATEGORIA = { qr: 'Códigos QR', whatsapp: 'WhatsApp', paleta: 'Colores', logo: 'Logos', nombres: 'Nombres y slogan',
  diseno: 'Diseño para imprimir', redes: 'Redes sociales', docs: 'Formatos y documentos', legal: 'Textos legales',
  menu: 'Menú y catálogo', web: 'Página web', dominio: 'Dominio y hosting', correo: 'Correo', google: 'Google',
  seo: 'SEO', marketing: 'Publicidad y marketing', negocio: 'Negocio', cobros: 'Cobros', giro: 'Por giro' };

function leerCsv(texto) {
  const filas = []; let fila = [], campo = '', comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) { if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; } else if (c === '"') comillas = false; else campo += c; }
    else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [cab, ...resto] = filas;
  return resto.filter((f) => f.length > 1).map((f) => Object.fromEntries(cab.map((k, i) => [k, f[i] ?? ''])));
}

const args = process.argv.slice(2);
if (args[0] === '--importar') {
  const filas = leerCsv(fs.readFileSync(args[1], 'utf8'));
  const lista = filas.map((f) => ({ id: f.id, slug: f.slug, molde: f.molde, cabeza: f.cabeza,
    busquedas: f.busquedas ? f.busquedas.split(' ; ') : [], volumen_cabeza_conservador: +f.volumen_cabeza_conservador || 0,
    volumen_mexico: +f.volumen_mexico || 0, nivel: f.nivel, herramienta: f.herramienta || null, modo: f.modo || null,
    prioridad: +f.prioridad, relacionadas: f.relacionadas_sugeridas ? f.relacionadas_sugeridas.split(' ; ') : [],
    familia: f.familia, categoria: CATEGORIA[f.familia] || '', nota: f.nota }));
  fs.writeFileSync(LISTA, JSON.stringify(lista, null, 1) + '\n');
  console.log(`lista: ${lista.length} páginas en fijas/lista.json`);
  process.exit(0);
}
if (!args.length) { console.log('uso: node fijas/nueva.mjs <id> [<id> ...]  |  --importar <csv>'); process.exit(1); }
const lista = JSON.parse(fs.readFileSync(LISTA, 'utf8'));
const hoy = hoyCDMX();
for (const id of args) {
  const l = lista.find((x) => x.id === id);
  if (!l) { console.error(`${id}: no está en fijas/lista.json`); process.exitCode = 1; continue; }
  const f = path.join(DIR_PAGINAS, id + '.json');
  if (fs.existsSync(f)) { console.log(`${id}: ya existe, no se toca`); continue; }
  const p = { id: l.id, slug: l.slug, molde: l.molde, cabeza: l.cabeza, busquedas: l.busquedas,
    title: '', h1: '', description: '', resumen: '', categoria: l.categoria, revisada: null,
    respuesta: [], herramienta: l.herramienta ? { id: l.herramienta, modo: l.modo || undefined } : null,
    cuerpo: [], faqs: [], relacionadas: l.relacionadas.slice(0, 6),
    venta: { puente: '', aviso: '', trabajos: [] }, fuentes: [], serp: [],
    creada: hoy, actualizado: hoy, publicacion: null, nota: l.nota || '' };
  fs.mkdirSync(DIR_PAGINAS, { recursive: true });
  fs.writeFileSync(f, JSON.stringify(p, null, 2) + '\n');
  console.log(`${id}: esqueleto creado en fijas/paginas/${id}.json`);
}
