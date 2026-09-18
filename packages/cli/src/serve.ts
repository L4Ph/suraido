/**
 * Serves a built deck, and keeps every browser watching it on the same slide.
 *
 * One process, so the sync client comes from the same origin as the deck and the two can never
 * disagree about where the relay is or what it speaks.
 */

import { readFile, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, resolve, sep } from "node:path";
import { CLIENT } from "./client.ts";
import { relay } from "./relay.ts";

export const PORT = 4477;

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

/** Puts the sync client in just before the page ends, so the deck has already been declared. */
export function inject(html: string): string {
  return html.includes("</body>") ? html.replace("</body>", `${CLIENT}</body>`) : html + CLIENT;
}

export function serve(dir: string, port: number = PORT): Server {
  const root = resolve(dir);

  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://deck").pathname);
    let file = resolve(root, `.${path}`);

    // Everything below is read straight off disk and handed to whoever asked, so a path that
    // climbs out of the directory being served is the one thing that must not get through.
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

    try {
      const type = TYPES[extname(file)] ?? "application/octet-stream";
      const body = await readFile(file);
      // A stale deck on the projector is the worst thing this server could hand out, and it
      // costs nothing to avoid: everything here is coming off local disk over a local network.
      res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      res.end(type === "text/html" ? inject(body.toString()) : body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" }).end("not here\n");
    }
  });

  relay(server);
  server.listen(port);
  return server;
}
