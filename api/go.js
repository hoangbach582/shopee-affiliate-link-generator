export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send("Missing ID");
  }

  try {
    // We use tinyurl as our headless database.
    // Fetch the tinyurl link but DO NOT follow the redirect.
    // We only want to read the 'location' header where the actual Shopee link is stored.
    const tinyUrl = `https://tinyurl.com/${id}`;

    const response = await fetch(tinyUrl, {
      method: "HEAD",
      redirect: "manual", // Prevent Node.js fetch from automatically following the redirect
    });

    let location = response.headers.get("location");

    if (location) {
      // 1. Intercept TinyURL's Viglink Ads/Tracking
      // If TinyURL tries to route us through viglink, we extract the pure URL and bypass it!
      if (location.includes("viglink.com")) {
        try {
          const urlObj = new URL(location);
          const targetUrl = urlObj.searchParams.get("u");
          if (targetUrl) location = targetUrl;
        } catch (e) {
          console.warn("Failed to parse viglink url");
        }
      }

      // CRITICAL FIX: Use a client-side JS redirect instead of HTTP 301.
      //
      // WHY: Shopee Affiliate only counts a "click" when the request to
      // s.shopee.vn/an_redir comes from a real user browser. If we use a
      // server-side 301 redirect, the final hop to Shopee still originates
      // from the Vercel server IP — Shopee sees a bot/server, not a human
      // click, and the click is NOT recorded in the affiliate dashboard.
      //
      // By returning an HTML page that does `window.location.href = affiliateUrl`,
      // the USER'S BROWSER makes the request to Shopee directly, so the click
      // is counted correctly.
      const safeLocation = location.replace(/'/g, "%27");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Đang chuyển hướng...</title>
    <style>
      body { font-family: sans-serif; display: flex; align-items: center;
             justify-content: center; min-height: 100vh; margin: 0;
             background: #fef3ee; color: #ee4d2d; }
    </style>
  </head>
  <body>
    <p>⏳ Đang mở Shopee...</p>
    <script>
      // Client-side redirect so Shopee counts this as a real browser click
      window.location.replace('${safeLocation}');
    </script>
  </body>
</html>`);
    } else {
      // If there's no location header, the ID might be invalid.
      return res.status(404).send("Link not found in database.");
    }
  } catch (error) {
    console.error("Error retrieving link from database:", error);
    return res.status(500).send("Internal Server Error");
  }
}
