/**
 * GET /go/:id
 *
 * Cloudflare Pages Function (dynamic route) — handles short link redirects.
 *
 * Reads the original affiliate URL from Cloudflare KV, then returns an HTML
 * page with a client-side JavaScript redirect.
 *
 * WHY client-side JS redirect (not HTTP 301/302)?
 * Shopee Affiliate only counts a "click" when the request to
 * s.shopee.vn/an_redir comes from a real user browser.
 * A server-side redirect would make Vercel/Cloudflare's server IP hit Shopee,
 * which Shopee ignores for commission tracking.
 * With `window.location.replace(url)`, the user's browser makes the request
 * directly → Shopee records the click ✅
 *
 * Binding required in wrangler.toml / Cloudflare Dashboard:
 *   [[kv_namespaces]]
 *   binding = "LINKS_KV"
 */

export async function onRequest({ params, env }) {
  const { id } = params;

  if (!id) {
    return new Response("Missing ID", { status: 400 });
  }

  if (!env.LINKS_KV) {
    return new Response("KV store not configured", { status: 500 });
  }

  const affiliateUrl = await env.LINKS_KV.get(id);

  if (!affiliateUrl) {
    return new Response(
      `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <title>Link không tồn tại</title>
    <style>
      body { font-family: sans-serif; text-align: center; margin-top: 20vh; color: #333; }
    </style>
  </head>
  <body>
    <h1>404 — Link không tồn tại hoặc đã hết hạn</h1>
    <p>Link rút gọn này không còn hiệu lực.</p>
  </body>
</html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Escape single quotes to avoid breaking the JS string literal
  const safeUrl = affiliateUrl.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  const html = `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Đang mở Shopee...</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; min-height: 100vh; background: #fef3ee;
        color: #ee4d2d; gap: 16px;
      }
      .spinner {
        width: 40px; height: 40px; border: 4px solid rgba(238,77,45,0.2);
        border-top-color: #ee4d2d; border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      p { font-size: 16px; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="spinner"></div>
    <p>⏳ Đang mở Shopee...</p>
    <script>
      // Client-side redirect: ensures the browser (not the server) hits
      // Shopee's tracking endpoint so the affiliate click is counted correctly.
      window.location.replace('${safeUrl}');
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
