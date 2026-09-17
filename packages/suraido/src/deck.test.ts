import { expect, test, vi } from "vite-plus/test";

/**
 * A regression test for opening a URL that already carries a step.
 * The bug this covers passed when reached through a hash change, so always look at the
 * first render from cold.
 *
 * Deck and Step keep the current step in module scope, so each position resets the modules
 * and imports them again — with the URL set first.
 */
async function mountDeck(hash: string, kind: "points" | "list" = "points") {
  location.hash = hash;
  vi.resetModules();

  const { Slide, Step, Deck } = await import("./deck.tsx");
  const { render } = await import("./dom.ts");
  const { jsx } = await import("./jsx-runtime.ts");

  class Points extends Slide {
    static path = "points";
    static steps = 3;
    render() {
      return jsx(Step, { n: 1, children: jsx(Step, { n: 2, children: "x" }) });
    }
  }

  class List extends Slide {
    static path = "list";
    static steps = 3;
    render() {
      return jsx("ul", {
        children: [
          jsx(Step, { n: 1, as: "li", children: "a" }),
          jsx(Step, { n: 2, as: "li", children: "b" }),
        ],
      });
    }
  }

  const host = document.createElement("div");
  render(jsx(Deck, { slides: [kind === "list" ? List : Points] }), host);
  await new Promise((r) => setTimeout(r, 0));
  return {
    host,
    shown: [...host.querySelectorAll(".step")].map((e) => e.hasAttribute("data-shown")),
    hash: location.hash,
  };
}

test('<Step as="li"> lands directly under the ul, with no div between', async () => {
  const { host } = await mountDeck("#list.1", "list");
  const ul = host.querySelector("ul")!;
  // only li directly under ul; a div between them stops ul > li matching
  expect([...ul.children].map((c) => c.tagName.toLowerCase())).toEqual(["li", "li"]);
  expect(ul.querySelector('li.step[data-n="1"]')).toBeTruthy();
  expect(ul.querySelectorAll("div").length).toBe(0);
});

test("opening #points.2 from cold shows step 2 from the first render", async () => {
  const { shown, hash } = await mountDeck("#points.2");
  expect(shown).toEqual([true, true]);
  expect(hash).toBe("#points.2");
});

test("opening without a step shows nothing yet", async () => {
  const { shown } = await mountDeck("#points");
  expect(shown).toEqual([false, false]);
});

test("an out-of-range step is rounded, and the URL is normalised", async () => {
  const { shown, hash } = await mountDeck("#points.9");
  expect(shown).toEqual([true, true]);
  expect(hash).toBe("#points.2");
});
