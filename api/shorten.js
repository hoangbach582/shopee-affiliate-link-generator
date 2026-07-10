export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  // Define Kutt API configuration
  const KUTT_HOST = process.env.KUTT_HOST || "https://kutt.it";
  const KUTT_API_KEY = process.env.KUTT_API_KEY;

  if (!KUTT_API_KEY) {
    console.warn("KUTT_API_KEY is not set. Using free ulvis.net fallback...");
    try {
      const ulvisResponse = await fetch(
        `https://ulvis.net/api.php?url=${encodeURIComponent(url)}`
      );
      if (ulvisResponse.ok) {
        const ulvisData = await ulvisResponse.text();
        if (ulvisData.startsWith("http")) {
          return res.status(200).json({ shortUrl: ulvisData });
        }
      }
    } catch (ulvisErr) {
      console.warn("Ulvis fallback failed, returning original URL");
    }
    // If no API key is provided and ulvis fails, gracefully degrade by returning the original long URL
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
