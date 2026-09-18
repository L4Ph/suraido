import { afterEach, expect, test } from "vite-plus/test";
import { Deck, Slide, Step } from "./deck.tsx";
import { flushSync, render } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";

class Points extends Slide {
  static path = "points";
  static steps = 3;
  render() {
    return jsx("div", {
      children: [jsx(Step, { n: 1, children: "a" }), jsx(Step, { n: 2, children: "b" })],
    });
  }
}

/** Something outside the slide that it redraws for: a vote arriving, a timer ticking. */
const votes = {
  count: 0,
  runs: new Set<() => void>(),
  subscribe(run: () => void) {
    this.runs.add(run);
    return () => void this.runs.delete(run);
  },
  cast() {
    this.count++;
    for (const run of this.runs) run();
  },
};

class Counting extends Slide {
  static path = "counting";
  static steps = 3;
  mounted() {
    this.watch(votes);
  }
  render() {
    return jsx("div", {
      children: [
        String(votes.count),
        jsx(Step, { n: 1, children: "a" }),
        jsx(Step, { n: 2, children: "b" }),
      ],
    });
  }
}

/** Which reveals are showing, read the way the CSS reads them. */
const shownIn = (el: Element) =>
  [...el.querySelectorAll(".step[data-n]")].map((s) => s.hasAttribute("data-shown"));

/** mounted() runs on a microtask, and it is what normalises the URL. */
const tick = () => new Promise((r) => setTimeout(r, 0));

/** Every deck binds keydown, hashchange and resize. One left behind answers the next test. */
const attached: Deck[] = [];
async function mount(slides: (typeof Points)[], hash = "") {
  location.hash = hash;
  const host = document.body.appendChild(document.createElement("div"));
  const deck = render(jsx(Deck, { slides }), host).comp as Deck;
  attached.push(deck);
  await tick();
  return { deck, host };
}
afterEach(() => {
  for (const deck of attached.splice(0)) deck.unmounted();
  document.body.innerHTML = "";
  votes.count = 0;
});

/**
 * Printing and the overview both put more than one slide on the page at once, each showing a
 * different amount. A step that lives in one module-level variable cannot say that.
 */
test("two decks on one page keep their own step", async () => {
  const left = await mount([Points]);
  const right = await mount([Points]);

  left.deck.go([0, 2]);

  expect(shownIn(left.host)).toEqual([true, true]);
  expect(shownIn(right.host)).toEqual([false, false]);
});

/**
 * Stepping deliberately does not re-render, so a slide that rebuilds itself afterwards is the
 * one path that reads the step rather than being handed it.
 */
test("a slide that redraws itself after stepping keeps its reveals", async () => {
  const { deck, host } = await mount([Counting]);

  deck.go([0, 2]);
  expect(shownIn(host)).toEqual([true, true]);

  votes.cast();
  flushSync();

  expect(host.textContent).toContain("1");
  expect(shownIn(host)).toEqual([true, true]);
});
