// Aviso de «correo abierto»: cada correo de prospección lleva una imagen de 1 píxel
// con /o?i=<id>. Cuando el cliente de correo la carga, se anota aquí. Sin IP ni cookies.
// Ojo: Apple Mail descarga las imágenes solo (cuenta como abierto aunque no lo hayan visto)
// y quien bloquea imágenes no cuenta. Es una señal, no una prueba.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const GIF = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), (c) => c.charCodeAt(0));

export default async (req, context) => {
  const id = (new URL(req.url).searchParams.get("i") || "").toLowerCase();
  const ua = req.headers.get("user-agent") || "";
  const pixel = new Response(GIF, {
    status: 200,
    headers: { "content-type": "image/gif", "cache-control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
  if (!/^[a-f0-9]{12}$/.test(id)) return pixel;
  try {
    const tienda = getStore("abiertos");
    const v = (await tienda.get(id, { type: "json" })) || { veces: 0, primera: null, ultima: null, gmail: 0, apple: 0, celular: 0 };
    const ahora = new Date().toISOString();
    v.veces += 1;
    v.primera = v.primera || ahora;
    v.ultima = ahora;
    if (/GoogleImageProxy/i.test(ua)) v.gmail += 1;
    if (/Macintosh|iPhone|iPad/i.test(ua) && !/Chrome|Firefox/i.test(ua)) v.apple += 1;
    if (/mobile|android|iphone/i.test(ua)) v.celular += 1;
    // quién bajó la imagen (sirve para separar personas de revisores automáticos)
    v.agentes = (v.agentes || []).concat([{ t: ahora, ua: ua.slice(0, 160) }]).slice(-5);
    // de dónde (ciudad y estado de Netlify) y una huella corta de la red, sin guardar la IP
    const g = (context && context.geo) || {};
    const red = createHash("sha256").update("aliviane:" + ((context && context.ip) || "")).digest("hex").slice(0, 8);
    v.origen = (v.origen || []).concat([{ t: ahora, ciudad: g.city || "", estado: (g.subdivision && g.subdivision.name) || "", red, cel: /mobile|android|iphone/i.test(ua) }]).slice(-10);
    await tienda.setJSON(id, v);
  } catch (e) {
    // si falla el registro, igual se regresa la imagen para no dejar un ícono roto
  }
  return pixel;
};

export const config = { path: "/o" };
