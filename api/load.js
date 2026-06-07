// API: Load a published project by slug
const { head, list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  const slug = req.query.slug;
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }

  try {
    const { blobs } = await list({ prefix: `projects/${slug}.json` });
    if (!blobs || blobs.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const response = await fetch(blobs[0].url);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
