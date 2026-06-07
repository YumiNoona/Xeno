// API: Publish a .xeno project — stores it in Vercel Blob
const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const project = req.body;
    if (!project || project.type !== 'xeno-project') {
      return res.status(400).json({ error: 'Invalid project data' });
    }

    const slug = project.project.slug || ('project-' + Date.now());
    const blob = await put(
      `projects/${slug}.json`,
      JSON.stringify(project),
      { access: 'public', contentType: 'application/json' }
    );

    return res.status(200).json({
      slug: slug,
      url: blob.url,
      shareUrl: `https://xeno.venusapp.in/t/${slug}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
