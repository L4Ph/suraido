import { once } from "node:events";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vite-plus/test";
import { ENDPOINT } from "./relay.ts";
import { serve } from "./serve.ts";

const open: (() => void)[] = [];
afterEach(() => {
  for (const close of open.splice(0)) close();
});

/**
 * A built deck on disk, served the way someone would serve one — with a file next to it that
 * was never meant to go out, so "refused" can be checked against something real.
 */
async function built() {
  const dir = await mkdtemp(join(tmpdir(), "suraido-"));
  const deck = join(dir, "deck");
  await mkdir(deck);
  await writeFile(join(deck, "index.html"), "<html><body><div id=root></div></body></html>");
  await writeFile(join(deck, "deck.css"), ".deck{}");
  await writeFile(join(dir, "notes.txt"), "PRIVATE-NOTES");

  const server = serve(deck, 0);
  await once(server, "listening");
  open.push(() => server.close());
  return { dir, port: (server.address() as AddressInfo).port };
}

const get = async (port: number, path: string) => {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  return { status: res.status, type: res.headers.get("content-type"), body: await res.text() };
};

test("the deck comes back with the sync client already in it", async () => {
  const { port } = await built();
  const page = await get(port, "/");

  expect(page.body).toContain("<div id=root></div>");
  expect(page.body).toContain("WebSocket");
  // Last thing in the body, so the deck has been declared by the time it runs.
  expect(page.body.indexOf("WebSocket")).toBeGreaterThan(page.body.indexOf("id=root"));
});

test("a deck is one page, so an unknown path is still that page", async () => {
  const { port } = await built();
  expect((await get(port, "/themes")).body).toContain("id=root");
});

test("assets are served as themselves, without a script bolted on", async () => {
  const { port } = await built();
  const css = await get(port, "/deck.css");

  expect(css.type).toBe("text/css");
  expect(css.body).toBe(".deck{}");
});

test("a path that climbs out of the deck cannot reach what is next to it", async () => {
  const { port } = await built();

  // Written out, the URL parser folds the dots away before anything else sees them, and the
  // path lands back inside the deck. Percent-encoded, they survive that far — which is the
  // case the check on disk is actually there for.
  const encoded = await get(port, "/%2e%2e%2fnotes.txt");
  expect(encoded.status).toBe(403);

  for (const climb of ["/../notes.txt", "/..%2fnotes.txt", "/%2e%2e/notes.txt"]) {
    expect((await get(port, climb)).body).not.toContain("PRIVATE-NOTES");
  }
});

test("two browsers on the served deck end up on the same slide", async () => {
  const { port } = await built();

  const phone = new WebSocket(`ws://127.0.0.1:${port}${ENDPOINT}`);
  const heard: string[] = [];
  phone.addEventListener("message", (e: MessageEvent<string>) => heard.push(e.data));
  open.push(() => phone.close());
  await once(phone, "open");

  const talk = new WebSocket(`ws://127.0.0.1:${port}${ENDPOINT}?drive`);
  open.push(() => talk.close());
  await once(talk, "open");
  talk.send("#themes.2");

  for (let i = 0; i < 200 && heard.length === 0; i++) await new Promise((r) => setTimeout(r, 5));
  expect(heard).toEqual(["#themes.2"]);
});
