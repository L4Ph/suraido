import { afterEach, expect, test, vi } from "vite-plus/test";
import { font } from "./font.ts";

/**
 * What is worth testing here is not the font itself but the wiring: which URL is asked for,
 * which name the deck is told to use, and what happens when the id is wrong. The stylesheets
 * are faked — a test that needs jsDelivr to be up is a test that fails on a train.
 */

const meta = (over: Record<string, unknown> = {}) => ({
  family: "IBM Plex Sans JP",
  weights: [100, 200, 300, 400, 500, 600, 700],
  variable: false,
  npmVersion: "5.3.1",
  ...over,
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/**
 * Nothing is fetched and no stylesheet is parsed here (see the test config), so a link always
 * settles with no sheet behind it — which is also the case a deck is in when jsDelivr is down.
 */
const settle = async () => {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
};

const links = () => [...document.head.querySelectorAll("link")].map((l) => l.href);
const token = () => document.documentElement.style.getPropertyValue("--suraido-font");

afterEach(() => {
  document.head.innerHTML = "";
  document.documentElement.style.removeProperty("--suraido-font");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("the release is pinned, so the deck opens the same next year", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json(meta())),
  );
  void font("pinned");
  await settle();

  expect(links()[0]).toBe("https://cdn.jsdelivr.net/fontsource/css/pinned@5.3.1/400.css");
});

test("one stylesheet per weight, and only the weights the font has", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json(meta({ weights: [400, 700] }))),
  );
  void font("two-weights", { weights: [400, 900] });
  await settle();

  expect(links()).toEqual(["https://cdn.jsdelivr.net/fontsource/css/two-weights@5.3.1/400.css"]);
});

test("a variable font is one file, under the name it is published as", async () => {
  const say = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      json(meta({ family: "Roboto Flex", weights: [400], variable: true, npmVersion: "5.3.0" })),
    ),
  );

  void font("flex", { weights: [700] });
  await settle();

  expect(links()).toEqual(["https://cdn.jsdelivr.net/fontsource/css/flex:vf@5.3.0/index.css"]);
  // Not "Roboto Flex": the variable package publishes "Roboto Flex Variable". With a stylesheet
  // to read the name comes from it (verified in a browser); this is the other path, and a token
  // naming the plain family would be a deck that falls back without saying so.
  expect(token()).toContain('"Roboto Flex Variable"');
  expect(say).not.toHaveBeenCalled();
});

test("the token is the family, then the fallbacks", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json(meta())),
  );
  void font("with-fallback");
  await settle();

  expect(token()).toBe(
    '"IBM Plex Sans JP", system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif',
  );
});

test("a code font can be told which token to set", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json(meta({ family: "IBM Plex Mono" }))),
  );
  void font("mono", { token: "--suraido-font-mono" });
  await settle();

  expect(document.documentElement.style.getPropertyValue("--suraido-font-mono")).toContain(
    '"IBM Plex Mono"',
  );
  expect(token()).toBe("");
});

test("an id Fontsource does not have says so, and leaves the deck in the fallback", async () => {
  const say = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json({}, 404)),
  );

  await font("ibm-plex-sans-jap");
  await settle();

  expect(links()).toEqual([]);
  expect(token()).toBe("");
  expect(say.mock.calls[0]![0]).toContain("ibm-plex-sans-jap");
  expect(say.mock.calls[0]![0]).toContain("404");
});

test("no network is a warning, not a dead deck", async () => {
  const say = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );

  await font("offline");
  expect(say.mock.calls[0]![0]).toContain("could not reach Fontsource");
  expect(token()).toBe("");
});

test("the same font asked for twice is looked up once", async () => {
  const ask = vi.fn(async () => json(meta()));
  vi.stubGlobal("fetch", ask);

  void font("once");
  void font("once");
  await settle();

  expect(ask).toHaveBeenCalledTimes(1);
});
