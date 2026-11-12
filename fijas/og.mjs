#!/usr/bin/env node
// Imágenes Open Graph (1200×630, PNG ≤ 100 KB) para las fijas. Usa Chrome sin cabeza con un perfil temporal
// (nunca el perfil de Diego). Corre en la Mac, no en el workflow.
//   node fijas/og.mjs                 una imagen por molde en img/og/<molde>.png
//   node fijas/og.mjs --pagina <id>   una imagen propia en img/og/<id>.png con el H1 de la página
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { RAIZ, esc, cargarPaginas } from './lib.mjs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DIR = path.join(RAIZ, 'img', 'og');
const MOLDES = {
  herramienta: ['Herramientas gratis', 'para tu negocio'],
  guia: ['Guías para la página', 'de tu negocio'],
  servicio: ['Tu página web', 'desde $1,500 con dominio'],
  plantilla: ['Plantillas y formatos', 'gratis para tu negocio'],
  comparativa: ['Compara antes', 'de pagar tu página'],
  'por-giro': ['La página web', 'que tu giro necesita'],
  'por-ciudad': ['Páginas web para', 'negocios de tu ciudad'],
};
const LOGO = '<svg viewBox="0 0 64 64" width="64" height="64"><rect x="16.5" y="20" width="25" height="26" rx="8" fill="none" stroke="#f2f2f0" stroke-width="7"/><rect x="38" y="16.5" width="7.5" height="33" rx="1" fill="#f2f2f0"/></svg>';

function html(l1, l2) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:630px;background:#0b0b0b;overflow:hidden}
body{font-family:"Helvetica Neue",Arial,sans-serif;color:#f2f2f0;display:flex;flex-direction:column;justify-content:space-between;padding:70px 80px;box-sizing:border-box}
.m{display:flex;align-items:center;gap:6px;font-weight:700;font-size:40px;letter-spacing:-1px}
h1{font-weight:500;font-size:84px;line-height:1;letter-spacing:-3.5px;margin:0}h1 span{color:#8c8c8c;display:block}
p{font-size:26px;color:#8c8c8c;margin:0}</style></head><body><div class="m">${LOGO}aliviane</div>
<h1>${esc(l1)}<span>${esc(l2)}</span></h1><p>aliviane.mx</p></body></html>`;
}

function capturar(nombre, l1, l2) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
  const f = path.join(tmp, 'og.html');
  fs.writeFileSync(f, html(l1, l2));
  const out = path.join(DIR, nombre + '.png');
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${path.join(tmp, 'perfil')}`,
    '--no-first-run', '--no-default-browser-check', '--window-size=1200,630', `--screenshot=${out}`, 'file://' + f], { stdio: 'ignore' });
  fs.rmSync(tmp, { recursive: true, force: true });
  const kb = fs.statSync(out).size / 1024;
  console.log(`${path.relative(RAIZ, out)} ${kb.toFixed(1)} KB${kb > 100 ? '  ← PASA DE 100 KB' : ''}`);
}

fs.mkdirSync(DIR, { recursive: true });
const i = process.argv.indexOf('--pagina');
if (i >= 0) {
  const p = cargarPaginas().find((x) => x.id === process.argv[i + 1]);
  if (!p) { console.error('no existe esa página'); process.exit(1); }
  const palabras = p.h1.split(' '), mitad = Math.ceil(palabras.length / 2);
  capturar(p.id, palabras.slice(0, mitad).join(' '), palabras.slice(mitad).join(' '));
} else {
  for (const [m, [l1, l2]] of Object.entries(MOLDES)) capturar(m, l1, l2);
}
