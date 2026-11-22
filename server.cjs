const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTS = [5173, 8080];
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const requestHandler = (req, res) => {
  const safeUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.join(ROOT, safeUrl === '/' ? 'index.html' : safeUrl);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(ROOT, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
};

PORTS.forEach((port) => {
  const server = http.createServer(requestHandler);
  server.on('error', (err) => {
    console.warn(`Port ${port} skipped (${err.code})`);
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`🚀 旅行手冊伺服器已啟動：http://localhost:${port}`);
  });
});
