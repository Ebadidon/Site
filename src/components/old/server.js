const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const host = process.env.IP || '::';
const port = Number(process.env.PORT) || 8100;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((request, response) => {
  let requestPath;

  try {
    requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);

  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    const resolvedPath = statError || !stats.isDirectory()
      ? filePath
      : path.join(filePath, 'index.html');

    fs.readFile(resolvedPath, (readError, content) => {
      if (readError) {
        response.writeHead(readError.code === 'ENOENT' ? 404 : 500, {
          'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end(readError.code === 'ENOENT' ? 'Not found' : 'Server error');
        return;
      }

      const extension = path.extname(resolvedPath).toLowerCase();
      response.writeHead(200, {
        'Content-Type': contentTypes[extension] || 'application/octet-stream'
      });
      response.end(content);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Site listening on ${host}:${port}`);
});
