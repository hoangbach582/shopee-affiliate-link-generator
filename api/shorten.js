export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error(`TinyURL API responded with status: ${response.status}`);
    }

    const shortUrl = await response.text();
    
    // TinyURL returns the short URL as plain text
    res.status(200).json({ shortUrl: shortUrl.trim() });
  } catch (error) {
    console.error('Error shortening URL:', error);
    res.status(500).json({ error: 'Failed to shorten URL', details: error.message });
  }
}
