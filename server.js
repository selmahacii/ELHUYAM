const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Force production mode for cPanel deployment
const dev = false;
const port = process.env.PORT || 3000;

// Initialize Next.js without explicit hostname for Passenger compatibility
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).once('error', (err) => {
    console.error(err);
    process.exit(1);
  }).listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});

