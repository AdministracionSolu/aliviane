// Lista de visitas para el taller. Sólo responde con la llave VISITAS_TOKEN (variable de Netlify).
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const llave = Netlify.env.get("VISITAS_TOKEN");
  if (!llave || req.headers.get("x-llave") !== llave) return new Response("no", { status: 403 });
  const tienda = getStore("visitas");
  const { blobs } = await tienda.list();
  const out = {};
  for (const b of blobs) out[b.key] = await tienda.get(b.key, { type: "json" });
  return Response.json(out, { headers: { "cache-control": "no-store" } });
};

export const config = { path: "/visitas" };
