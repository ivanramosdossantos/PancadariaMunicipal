import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ttf': 'font/ttf',
  '.png': 'image/png', '.json': 'application/json' };
const publicFiles = new Set(['index.html', 'estilo.css', 'matriz.svg', 'design/tokens.css', 'design/logo.svg',
  'design/simbolo.svg', 'design/fontes/Silkscreen-Bold.ttf', 'design/fontes/IBM-Plex-Sans.ttf'].map(name => resolve(root, name)));
const port = Number(process.env.PORT ?? 8765);
createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end(); return; }
  const file = resolve(root, pathname === '/' ? 'index.html' : '.' + pathname);
  const type = types[extname(file)];
  const allowed = file.startsWith(resolve(root) + sep) && (file.startsWith(resolve(root, 'src') + sep) || file.startsWith(resolve(root, 'assets', 'lutadores') + sep) ||
    publicFiles.has(file));
  if (!allowed || !type || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': type + (type.startsWith('image/') ? '' : '; charset=utf-8'), 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log('http://127.0.0.1:' + port));
