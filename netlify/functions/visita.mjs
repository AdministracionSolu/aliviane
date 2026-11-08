// Cuenta cuándo se abre cada página de muestra (/sitios/<slug>/). Sin IP, sin cookies:
// sólo cuántas veces, la primera y la última, y si fue desde celular.
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const s = (new URL(req.url).searchParams.get("s") || "").toLowerCase();
  const ua = req.headers.get("user-agent") || "";
  const vacio = new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  if (!/^[a-z0-9-]{2,90}$/.test(s) || /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack/i.test(ua)) {
    return vacio;
  }
  try {
    const tienda = getStore("visitas");
    const v = (await tienda.get(s, { type: "json" })) || { veces: 0, primera: null, ultima: null, celular: 0 };
    const ahora = new Date().toISOString();
    v.veces += 1;
    v.primera = v.primera || ahora;
    v.ultima = ahora;
    if (/mobile|android|iphone/i.test(ua)) v.celular += 1;
    await tienda.setJSON(s, v);
    return vacio;
  } catch (e) {
    return new Response("error: " + String(e && e.message || e).slice(0, 300), { status: 500 });
  }
};

export const config = { path: "/v" };
