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

      // Secretly redirect the user directly to the original Shopee link,
      // completely bypassing any interstitial pages or viglink injection from TinyURL.
      return res.redirect(301, location);
    } else {
      // If there's no location header, the ID might be invalid.
      return res.status(404).send("Link not found in database.");
    }
  } catch (error) {
    console.error("Error retrieving link from database:", error);
    return res.status(500).send("Internal Server Error");
  }
}
