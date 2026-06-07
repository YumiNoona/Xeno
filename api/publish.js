// API: Publish a .xeno project — stores it in Vercel Blob
const { put, list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch(e) {}
  }

  try {
    // Accept either raw bundle or { project, expiry } object
    var bundle = req.body.project || req.body;
    var expiry = req.body.expiry || 'forever';

    if (!bundle || bundle.type !== 'xeno-project') {
      return res.status(400).json({ error: 'Invalid project data' });
    }

    var expiresAt = null;
    if (expiry === '1d') expiresAt = Date.now() + 86400000;
    else if (expiry === '7d') expiresAt = Date.now() + 604800000;

    bundle.expiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;

    const slug = bundle.project.slug || ('project-' + Date.now());

    // Preserve view count from previous publish
    try {
      var { blobs } = await list({ prefix: `projects/${slug}.json` });
      if (blobs && blobs.length > 0) {
        var old = await fetch(blobs[0].url).then(function(r) { return r.json(); }).catch(function() { return null; });
        if (old && old.views) bundle.views = old.views;
      }
    } catch(e) {}

    const blob = await put(
      `projects/${slug}.json`,
      JSON.stringify(bundle),
      { access: 'public', contentType: 'application/json' }
    );

    const host = req.headers.host || 'xeno.venusapp.in';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    return res.status(200).json({
      slug: slug,
      url: blob.url,
      shareUrl: proto + '://' + host + '/t/' + slug,
      expiresAt: bundle.expiresAt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
