// Server tanpa dependency: cukup `node server.js` (Node 16+)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// baca .env manual kalau ada
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(l => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  });
} catch (e) {}

const PORT = process.env.PORT || 3000;
const USER = process.env.ADMIN_USER || 'malzx';
const PASS = process.env.ADMIN_PASS || 'malzz098';
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB = path.join(DATA_DIR, 'data.json');
try { fs.mkdirSync(DATA_DIR, { recursive: true }); if (!fs.existsSync(DB)) fs.copyFileSync(path.join(__dirname, 'data.json'), DB); } catch (e) {}
const PUB = path.join(__dirname, 'public');
const sessions = new Set();
const fails = {};
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

const readDB = () => { try { return JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (e) { return []; } };
const writeDB = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const token = req => (/(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.cookie || '') || [])[1];
const authed = req => sessions.has(token(req));
const body = req => new Promise(r => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e5) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(b)); } catch (e) { r({}); } }); });
const clean = (s, n) => String(s || '').trim().slice(0, n);

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const ip = req.socket.remoteAddress;

  if (url === '/api/projects' && req.method === 'GET') return send(res, 200, readDB());
  if (url === '/api/me') return send(res, 200, { ok: authed(req) });

  if (url === '/api/login' && req.method === 'POST') {
    const f = fails[ip] || { n: 0, t: 0 };
    if (f.n >= 5 && Date.now() - f.t < 600000) return send(res, 429, { error: 'Terlalu banyak percobaan gagal. Silakan coba lagi dalam 10 menit.' });
    const b = await body(req);
    if (eq(String(b.username || ''), USER) && eq(String(b.password || ''), PASS)) {
      delete fails[ip];
      const t = crypto.randomBytes(24).toString('hex');
      sessions.add(t);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `sid=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400` });
      return res.end('{"ok":true}');
    }
    fails[ip] = { n: f.n + 1, t: Date.now() };
    return send(res, 401, { error: 'Username atau password salah.' });
  }

  if (url === '/api/logout' && req.method === 'POST') {
    sessions.delete(token(req));
    res.writeHead(200, { 'Set-Cookie': 'sid=; Max-Age=0; Path=/' });
    return res.end('{"ok":true}');
  }

  if (url === '/api/projects' && req.method === 'POST') {
    if (!authed(req)) return send(res, 401, { error: 'Silakan login terlebih dahulu.' });
    const b = await body(req);
    const item = { id: Date.now().toString(36), type: b.type === 'product' ? 'product' : 'project', name: clean(b.name, 80), desc: clean(b.desc, 300), link: clean(b.link, 300), tag: clean(b.tag, 20) };
    if (!item.name) return send(res, 400, { error: 'Nama wajib diisi.' });
    if (item.link && !/^https?:\/\//i.test(item.link)) return send(res, 400, { error: 'Link harus diawali http:// atau https://' });
    const d = readDB(); d.unshift(item); writeDB(d);
    return send(res, 200, item);
  }

  if (url.startsWith('/api/projects/') && req.method === 'DELETE') {
    if (!authed(req)) return send(res, 401, { error: 'Silakan login terlebih dahulu.' });
    const id = decodeURIComponent(url.split('/').pop());
    writeDB(readDB().filter(p => p.id !== id));
    return send(res, 200, { ok: true });
  }

  // halaman
  let file = url === '/' ? '/index.html' : (url === '/admin' || url === '/admin/') ? '/admin.html' : url;
  const full = path.normalize(path.join(PUB, file));
  if (!full.startsWith(PUB) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
}).listen(PORT, '0.0.0.0', () => console.log('Jalan di port ' + PORT));
