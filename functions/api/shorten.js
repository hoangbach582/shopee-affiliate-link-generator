/**
 * POST/GET /api/shorten?url=<affiliate_url>
 *
 * Cloudflare Pages Function — replaces the old TinyURL-backed shorten.js.
 *
 * Instead of calling TinyURL (~500–1500 ms round-trip), we:
 *   1. Generate a random short ID entirely on the edge.
 *   2. Store { id → url } in Cloudflare KV (sub-ms write).
 *   3. Return our own /go/:id short URL instantly.
 *
 * Binding required in wrangler.toml / Cloudflare Dashboard:
 *   [[kv_namespaces]]
 *   binding = "LINKS_KV"
 */

const ID_LENGTH = 8;
const TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

function generateId(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function onRequest({ request, env }) {
  const { searchParams, host, protocol: reqProtocol } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return Response.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  if (!env.LINKS_KV) {
    // Fallback: return the raw URL if KV is not bound yet (useful during dev)
    console.warn("[shorten] LINKS_KV not bound — returning original URL");
    return Response.json({ shortUrl: targetUrl });
  }

  // Generate a collision-resistant short ID
  let id = generateId(ID_LENGTH);

  // Tiny collision guard — retry once if the key already exists
  const existing = await env.LINKS_KV.get(id);
  if (existing) {
    id = generateId(ID_LENGTH);
  }

  // Persist to KV with a 1-year expiry
  await env.LINKS_KV.put(id, targetUrl, { expirationTtl: TTL_SECONDS });

  const scheme = host.startsWith("localhost") ? "http" : "https";
  const shortUrl = `${scheme}://${host}/go/${id}`;

  return Response.json({ shortUrl });
}
