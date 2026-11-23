/**
 * A static file server, alive only while a deck is being exported.
 *
 * A built deck asks for its assets by absolute path, so it cannot simply be opened off disk.
 * This is not a command and not something to deploy: no caching, no compression, no auth. It
 * exists for the few seconds a browser is reading the deck.
 */

import { readFile, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, resolve, sep } from "node:path";

const TYPES: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mjs": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

export function host(dir: string): Server {
  const root = resolve(dir);

  return createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://deck").pathname);
    let file = resolve(root, `.${path}`);

    // Everything under the directory is read straight off disk, so a path that climbs out of
    // it is the one thing that must not get through.
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end("no");
      return;
    }

    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    } catch {
      // A deck is one page addressed by its hash, so anything unknown is still that page.
      file = resolve(root, "index.html");
    }

    // Read first, then answer. Doing it the other way round, a path that stats as a file but
    // cannot be read — a directory, a race with a rebuild — sends 200 and then throws trying
    // to send 404 over it, which takes the whole server down mid-export.
    let body: Buffer;
    try {
      body = await readFile(file);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" }).end("not here\n");
      return;
    }

    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  });
}
