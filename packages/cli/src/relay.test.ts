import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, expect, test } from "vite-plus/test";
import { ENDPOINT, relay } from "./relay.ts";

/**
 * A real relay on a real port, spoken to by real WebSockets — node has had the browser's own
 * since 22, so proving this needs no `ws`, which is the point of writing the frames by hand.
 */
const open: (() => void)[] = [];

async function start() {
  const server = createServer((_req, res) => res.end("deck"));
  relay(server);
  server.listen(0);
  await once(server, "listening");
  open.push(() => server.close());
  return (server.address() as AddressInfo).port;
}

async function watcher(port: number, query = "") {
  const ws = new WebSocket(`ws://127.0.0.1:${port}${ENDPOINT}${query}`);
  const heard: string[] = [];
  ws.addEventListener("message", (e: MessageEvent<string>) => heard.push(e.data));
  open.push(() => ws.close());
  await once(ws, "open");
  return Object.assign(ws, { heard });
}

afterEach(() => {
  for (const close of open.splice(0)) close();
});

/** Nothing here is slower than a loopback round trip; wait for it rather than guessing. */
async function settles(check: () => boolean) {
  for (let i = 0; i < 200 && !check(); i++) await new Promise((r) => setTimeout(r, 5));
}

/** For the other half: proving nothing arrives means giving it a chance to. */
const quiet = () => new Promise((r) => setTimeout(r, 30));

test("where one browser moved to reaches the others", async () => {
  const port = await start();
  const talk = await watcher(port, "?drive");
  const phone = await watcher(port);
  const other = await watcher(port);

  talk.send("#intro.1");
  await settles(() => phone.heard.length > 0 && other.heard.length > 0);

  expect(phone.heard).toEqual(["#intro.1"]);
  expect(other.heard).toEqual(["#intro.1"]);
});

test("a browser is not told what it just said", async () => {
  const port = await start();
  const talk = await watcher(port, "?drive");
  const phone = await watcher(port);

  talk.send("#intro.1");
  await settles(() => phone.heard.length > 0);

  expect(talk.heard).toEqual([]);
});

test("someone opening the link halfway through lands where the talk is", async () => {
  const port = await start();
  const talk = await watcher(port, "?drive");
  talk.send("#themes.2");
  await quiet();

  const latecomer = await watcher(port);
  await settles(() => latecomer.heard.length > 0);

  expect(latecomer.heard).toEqual(["#themes.2"]);
});

test("the presenter reconnecting is not dragged back to where the room is", async () => {
  const port = await start();
  const phone = await watcher(port, "?drive");
  phone.send("#intro.1");
  await quiet();

  const talk = await watcher(port, "?drive");
  await quiet();

  // Their own deck is the authority. Being yanked backwards after a wifi blip is the one
  // thing a presenter would notice.
  expect(talk.heard).toEqual([]);
});

test("nothing but the relay's own endpoint is upgraded", async () => {
  const port = await start();
  const ws = new WebSocket(`ws://127.0.0.1:${port}/somewhere-else`);
  const [event] = (await Promise.race([
    once(ws, "close"),
    new Promise((r) => setTimeout(() => r(["never closed"]), 1000)),
  ])) as [unknown];
  expect(event).not.toBe("never closed");
});
