import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {extname, resolve, sep} from 'node:path';

// Serve the checked-in release at the same subdirectory used by GitHub Pages.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html=await readFile(resolve(root,'index.html'),'utf8');
const policy=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1]+"; frame-ancestors 'none'";
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json',
  '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png', '.txt':'text/plain', '.ttf':'font/ttf', '.woff2':'font/woff2'};

createServer(async (request, response) => {
  response.setHeader('Content-Security-Policy',policy);
  response.setHeader('X-Frame-Options','DENY');
  response.setHeader('Referrer-Policy','no-referrer');
  response.setHeader('X-Content-Type-Options','nosniff');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, {Allow:'GET, HEAD'}).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/' || pathname === '/kin') {
      response.writeHead(302, {Location:'/kin/'}).end();
      return;
    }
    if (!pathname.startsWith('/kin/')) {
      response.writeHead(404).end('Not found');
      return;
    }
    const file = resolve(root, pathname.slice('/kin/'.length) || 'index.html');
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream',
      'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Kin release preview: http://127.0.0.1:${port}/kin/`));
