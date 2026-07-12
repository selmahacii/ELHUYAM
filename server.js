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
  const server = createServer(async (req, res) => {
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

  // Passenger (cPanel) recycles worker processes regularly; without closing the
  // DB connections here, each recycle leaks MySQL connections until the pool
  // is exhausted and the site starts returning intermittent 500s.
  const shutdown = async (signal) => {
    console.log(`> Received ${signal}, shutting down gracefully`);
    server.close(() => process.exit(0));
    try {
      // src/lib/db.ts stores the singleton Prisma client on globalThis.prisma;
      // same Node process as this server, so it's reachable here without
      // requiring the (untranspiled) TS module directly.
      if (globalThis.prisma && typeof globalThis.prisma.$disconnect === 'function') {
        await globalThis.prisma.$disconnect();
      }
    } catch (err) {
      console.error('Error disconnecting Prisma', err);
    }
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
});

