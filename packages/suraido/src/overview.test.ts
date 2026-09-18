import { afterEach, expect, test } from "vite-plus/test";
import { Deck, slide, Step } from "./deck.tsx";
import { render } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";

const tick = () => new Promise((r) => setTimeout(r, 0));

const Cover = slide({ path: "cover" }, () => jsx("h1", { children: "cover" }));
const Middle = slide({ path: "middle" }, () =>
  jsx("div", { children: [jsx(Step, { children: "later" }), "middle"] }),
);
const Last = slide({ path: "last" }, () => jsx("h1", { children: "last" }));

const decks: Deck[] = [];
async function mount(hash = "") {
  location.hash = hash;
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  const deck = render(jsx(Deck, { slides: [Cover, Middle, Last] }), host).comp as Deck;
  decks.push(deck);
  await tick();
  return { deck, host };
}
afterEach(() => {
  for (const deck of decks.splice(0)) deck.unmounted();
  document.body.innerHTML = "";
});

const press = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key }));
const sheets = (host: Element) => [...host.querySelectorAll(".sheet")];

/**
 * Going back to something said earlier means pressing left eight times in front of everyone.
 * Seeing the deck at once and pointing at the right slide is the whole feature.
 */
test("o shows every slide at once, and o again puts it away", async () => {
  const { host } = await mount("#middle");
  expect(sheets(host).length).toBe(0);

  press("o");
  expect(sheets(host).length).toBe(3);
  expect(host.textContent).toContain("cover");
  expect(host.textContent).toContain("last");

  press("o");
  expect(sheets(host).length).toBe(0);
  expect(host.querySelector("h1")).toBe(null); // back on the middle slide
});

test("Escape puts it away too", async () => {
  const { host } = await mount();
  press("o");
  expect(sheets(host).length).toBe(3);

  press("Escape");
  expect(sheets(host).length).toBe(0);
});

test("the slide you are on is the one marked", async () => {
  const { host } = await mount("#middle");
  press("o");

  const here = sheets(host).map((s) => s.hasAttribute("data-here"));
  expect(here).toEqual([false, true, false]);
});

test("clicking a slide goes there, and puts the overview away", async () => {
  const { deck, host } = await mount("#cover");
  press("o");

  sheets(host)[2]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await tick();

  expect(sheets(host).length).toBe(0);
  expect(deck.snapshot().index).toBe(2);
  expect(location.hash).toBe("#last");
});

/** A thumbnail of a slide half revealed is not a thumbnail of the slide. */
test("every slide is shown with its reveals already out", async () => {
  const { host } = await mount("#cover");
  press("o");

  const shown = [...host.querySelectorAll(".step")].map((s) => s.hasAttribute("data-shown"));
  expect(shown).toEqual([true]);
});
