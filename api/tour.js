// API: Serve preview.html with injected load URL for shared tours
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'https://xeno.venusapp.in');
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return res.status(400).send('Missing slug');
  }

  try {
    const htmlPath = path.join(process.cwd(), 'preview.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Inject the load URL before the viewer.js script loads
    const injectScript = '<script>window.XENO_LOAD_URL="/api/load/' + slug + '";</script>';
    html = html.replace('</head>', injectScript + '\n</head>');

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send('Error loading tour: ' + err.message);
  }
};
