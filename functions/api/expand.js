/**
 * GET /api/expand?url=<short_shopee_url>
 *
 * Cloudflare Pages Function — expands Shopee short links (s.shopee.vn, shope.ee)
 * to their full product URLs before generating the affiliate deep link.
 *
 * Runs on Cloudflare's edge — no cold starts, sub-50ms overhead for VN users.
 */

export async function onRequest({ request }) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !url.startsWith("http")) {
    return Response.json({ error: "Invalid or missing URL" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
    });

    return Response.json({ expandedUrl: response.url });
  } catch (error) {
    console.error("[expand] Error:", error);
    return Response.json(
      { error: "Could not expand the URL" },
      { status: 500 }
    );
  }
}
