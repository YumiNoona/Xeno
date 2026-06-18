// API: Delete a published project blob
const { list, del } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  const slug = req.query && req.query.slug
    ? req.query.slug
    : new URL(req.url, 'https://' + (req.headers.host || 'localhost')).searchParams.get('slug');
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }

  // Validate slug to prevent directory/path traversal or command injection
  if (typeof slug !== 'string' || !/^[a-zA-Z0-9\-_]+$/.test(slug)) {
    return res.status(400).json({ error: 'Invalid slug format' });
  }

  // Same-origin verification and shared token check
  const host = req.headers.host;
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const secFetchSite = req.headers['sec-fetch-site'];

  let isAuthorized = false;

  // Sec-Fetch-Site is a robust browser header for same-origin
  if (secFetchSite === 'same-origin') {
    isAuthorized = true;
  } else {
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost === host) {
          isAuthorized = true;
        }
      } catch (e) {}
    }
    if (!isAuthorized && referer) {
      try {
        const refererHost = new URL(referer).host;
        if (refererHost === host) {
          isAuthorized = true;
        }
      } catch (e) {}
    }
  }

  // Shared token check (supports local config or API client deletion)
  const deleteSecret = process.env.DELETE_SECRET;
  const deleteToken = req.headers['x-delete-token'] || (req.query && req.query.token);
  if (deleteSecret && deleteToken === deleteSecret) {
    isAuthorized = true;
  }

  // If local development or no environment secret is configured, fallback to allowing localhost same-origin
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized: Deletion is restricted to same-origin requests or requires a valid DELETE_SECRET token.' });
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
