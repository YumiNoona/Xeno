// API: Delete a published project blob
const { list, del } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  const slug = req.query && req.query.slug
    ? req.query.slug
    : new URL(req.url, 'https://' + (req.headers.host || 'localhost')).searchParams.get('slug');
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }

  try {
    const { blobs } = await list({ prefix: `projects/${slug}.json` });
    if (blobs && blobs.length > 0) {
      await del(blobs[0].url);
    }
    return res.status(200).json({ deleted: true, slug: slug });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
