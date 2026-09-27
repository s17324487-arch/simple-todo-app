// 依存なしの小さな静的サーバー。game/ フォルダをそのまま配信する。
// 使い方: node tools/serve.mjs [port]   → http://localhost:8080/
// テスト（tests/smoke.mjs）からも import して使う。
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const GAME_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".svg": "image/svg+xml", ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8",
};

export function serve({ root = GAME_DIR, port = 8080, quiet = false } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (path.endsWith("/")) path += "index.html";
      const file = normalize(join(root, path));
      if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const st = await stat(file);
      if (st.isDirectory()) { res.writeHead(302, { Location: path + "/" }).end(); return; }
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("not found");
    }
  });
  return new Promise((ok, ng) => {
    server.once("error", ng);
    server.listen(port, "127.0.0.1", () => {
      const p = server.address().port;
      if (!quiet) console.log(`ぽかぽかタウン: http://localhost:${p}/  （止めるには Ctrl+C）`);
      ok({ server, port: p, url: `http://127.0.0.1:${p}/` });
    });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  serve({ port: Number(process.argv[2] || 8080) });
}
