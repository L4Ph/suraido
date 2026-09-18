import { once } from "node:events";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vite-plus/test";
import { host } from "./host.ts";

const open: (() => void)[] = [];
afterEach(() => {
  for (const close of open.splice(0)) close();
});

/**
 * A built deck on disk, with a file next to it that was never meant to go out, so "refused"
 * can be checked against something real.
 */
async function built() {
  const dir = await mkdtemp(join(tmpdir(), "suraido-"));
  const deck = join(dir, "deck");
  await mkdir(deck);
  await writeFile(join(deck, "index.html"), "<html><body><div id=root></div></body></html>");
  await writeFile(join(deck, "deck.css"), ".deck{}");
  await writeFile(join(dir, "notes.txt"), "PRIVATE-NOTES");

  const server = host(deck);
  server.listen(0);
  await once(server, "listening");
  open.push(() => server.close());
  return { port: (server.address() as AddressInfo).port };
}

const get = async (port: number, path: string) => {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  return { status: res.status, type: res.headers.get("content-type"), body: await res.text() };
};

test("the deck comes back as it was written", async () => {
  const { port } = await built();
  const page = await get(port, "/");
  expect(page.body).toContain("<div id=root></div>");
  expect(page.type).toBe("text/html");
});

test("a deck is one page, so an unknown path is still that page", async () => {
  const { port } = await built();
  expect((await get(port, "/themes")).body).toContain("id=root");
});

test("assets are served as themselves", async () => {
  const { port } = await built();
  const css = await get(port, "/deck.css");
  expect(css.type).toBe("text/css");
  expect(css.body).toBe(".deck{}");
});

test("a path that climbs out of the deck cannot reach what is next to it", async () => {
  const { port } = await built();

  // Written out, the URL parser folds the dots away before anything else sees them. Percent
  // encoded they survive that far, which is the case the check on disk is there for.
  expect((await get(port, "/%2e%2e%2fnotes.txt")).status).toBe(403);

  for (const climb of ["/../notes.txt", "/..%2fnotes.txt", "/%2e%2e/notes.txt"]) {
    expect((await get(port, climb)).body).not.toContain("PRIVATE-NOTES");
  }
});
