export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  // Define Kutt API configuration
  const KUTT_HOST = process.env.KUTT_HOST || "https://kutt.it";
  const KUTT_API_KEY = process.env.KUTT_API_KEY;

  if (!KUTT_API_KEY) {
    // If no Kutt API key, we use TinyURL as a headless database.
    try {
      const fallbackResponse = await fetch(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
      );
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.text();
        if (fallbackData.startsWith("http")) {
          // Extract the unique ID from TinyURL (e.g., https://tinyurl.com/xyz123 -> xyz123)
          const tinyId = fallbackData.split("/").pop();

          // Construct our own custom short URL using the current Vercel domain!
          // We use https if it's not localhost.
          const protocol = req.headers.host.includes("localhost")
            ? "http"
            : "https";
          const customShortUrl = `${protocol}://${req.headers.host}/go/${tinyId}`;

          return res.status(200).json({ shortUrl: customShortUrl });
        }
      }
    } catch (fallbackErr) {
      console.warn(
        "Headless DB fallback failed, returning original URL",
        fallbackErr
      );
    }

    // Fallback to original URL if everything fails
    return res.status(200).json({ shortUrl: url });
  }

  try {
    const response = await fetch(`${KUTT_HOST}/api/v2/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": KUTT_API_KEY,
      },
      body: JSON.stringify({
        target: url,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Kutt API responded with status: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    // Kutt returns the shortened link in the `link` property
    res.status(200).json({ shortUrl: data.link });
  } catch (error) {
    console.error("Error shortening URL via Kutt:", error);
    // Fallback to original URL on error so the app doesn't break
    res.status(200).json({ shortUrl: url });
  }
}
