// API: Load a published project by slug — auto-deletes expired, counts views
const { list, del, put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'https://xeno.venusapp.in');
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { blobs } = await list({ prefix: `projects/${slug}.json` });
    if (!blobs || blobs.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    var blob = blobs[0];
    var response = await fetch(blob.url);
    var data = await response.json();

    // Check expiry
    if (data.expiresAt) {
      var expiresDate = new Date(data.expiresAt).getTime();
      if (Date.now() > expiresDate) {
        try { await del(blob.url); } catch(e) {}
        return res.status(410).json({ error: 'This tour has expired' });
      }
    }

    // Increment view counter (fire-and-forget, don't block response)
    data.views = (data.views || 0) + 1;
    try {
      await put(`projects/${slug}.json`, JSON.stringify(data), { access: 'public', contentType: 'application/json' });
    } catch(e) {}

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
