// API: Serve preview.html with injected load URL for shared tours
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  const slug = req.query && req.query.slug
    ? req.query.slug
    : new URL(req.url, 'https://' + (req.headers.host || 'localhost')).searchParams.get('slug');
  if (!slug) {

(Showing lines 5-9 of api/tour.js. Use offset=0 to continue.)

    return res.status(400).send('Missing slug');
  }

  try {
    const htmlPath = path.join(process.cwd(), 'preview.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Strip export-remove sentinel lines (same as export.js)
    html = html.split('\n').filter(function(l) { return l.indexOf('xeno-export-remove') === -1; }).join('\n');

    // Inject the load URL before the viewer.js script loads
    const injectScript = '<script>window.XENO_LOAD_URL="/api/load?slug=' + slug + '";</script>';
    html = html.replace('</head>', injectScript + '\n</head>');

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send('Error loading tour: ' + err.message);
  }
};
