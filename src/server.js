const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const config = require('../config/config');

const server = http.createServer((req, res) => {
  const modelPath = path.join(process.cwd(), config.models.path, req.url);

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  fs.readFile(modelPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('500 Internal Server Error');
      }
    } else {
      const etag = crypto.createHash('md5').update(content).digest('hex');

      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === etag) {
        res.writeHead(304);
        res.end();
      } else {
        zlib.gzip(content, (err, compressedModel) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('500 Internal Server Error');
            return;
          }

          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Encoding': 'gzip',
            'ETag': etag,
          });
          res.end(compressedModel);
        });
      }
    }
  });
});

server.listen(config.server.port, () => {
  console.log(`Server running on http://localhost:${config.server.port}`);
});
