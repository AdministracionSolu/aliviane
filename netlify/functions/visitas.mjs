// Lista de visitas para el taller (scripts/visitas.py). Pide la llave en el encabezado x-llave.
// Aquí sólo está su huella SHA-256: la llave no está en el código ni en Netlify.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const HUELLA = "2f543af3548a82eac9930307bfb87613b485fca1993872f09187fbcbf1e5cb3e";

export default async (req) => {
  const llave = req.headers.get("x-llave") || "";
  if (createHash("sha256").update(llave).digest("hex") !== HUELLA) return new Response("no", { status: 403 });
  // ?de=abiertos lee los correos abiertos; sin nada, las visitas a las muestras
  const de = new URL(req.url).searchParams.get("de") === "abiertos" ? "abiertos" : "visitas";
  const tienda = getStore({ name: de, consistency: "strong" });
  const { blobs } = await tienda.list();
  const out = {};
  for (const b of blobs) out[b.key] = await tienda.get(b.key, { type: "json" });
  return Response.json(out, { headers: { "cache-control": "no-store" } });
};

export const config = { path: "/visitas" };
