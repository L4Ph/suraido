import { afterEach, expect, test } from "vite-plus/test";
import { Deck, Slide, Step, type SlideComponent } from "./deck.tsx";
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

class Listed extends Slide {
  static path = "listed";
  static steps = 3;
  render() {
    return jsx("ul", {
      children: [
        jsx(Step, { n: 1, children: jsx("li", { class: "lead", children: "a" }) }),
        jsx(Step, { n: 2, children: jsx("li", { children: "b" }) }),
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
async function mount(slides: SlideComponent[], hash = "") {
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

/**
 * A <Step> that builds its own element has to be told what element is allowed where it stands.
 * One that marks the element already there never has to ask.
 */
test("a Step around an li lands directly under the ul", async () => {
  const { host } = await mount([Listed], "#listed.1");
  const ul = host.querySelector("ul")!;

  expect([...ul.children].map((c) => c.tagName.toLowerCase())).toEqual(["li", "li"]);
  expect(ul.querySelectorAll("div").length).toBe(0);
  expect(ul.querySelector('li.step[data-n="1"]')).toBeTruthy();
});

test("marking an element keeps the class it already had", async () => {
  const { host } = await mount([Listed], "#listed.1");
  expect(host.querySelector("li")!.className.split(" ").sort()).toEqual(["lead", "step"]);
});

test("a Step around bare text still gets something to hang the mark on", async () => {
  const { host } = await mount([Points], "#points.1");
  expect(host.querySelectorAll("div.step").length).toBe(2);
});

/** JSX keeps same-line whitespace, so this arrives as three children rather than one. */
test("whitespace around the element does not stop it being marked", async () => {
  class Spaced extends Slide {
    static path = "spaced";
    static steps = 2;
    render() {
      return jsx("ul", {
        children: jsx(Step, { n: 1, children: [" ", jsx("li", { children: "a" }), " "] }),
      });
    }
  }

  const { host } = await mount([Spaced], "#spaced.1");
  expect([...host.querySelector("ul")!.children].map((c) => c.tagName.toLowerCase())).toEqual([
    "li",
  ]);
});

/** Numbering every reveal by hand means renumbering all of them to insert one. */
test("a Step with no number takes the one after the last", async () => {
  class Bare extends Slide {
    static path = "bare";
    static steps = 4;
    render() {
      return jsx("div", {
        children: [
          jsx(Step, { children: "a" }),
          jsx(Step, { children: "b" }),
          jsx(Step, { children: "c" }),
        ],
      });
    }
  }

  const { deck, host } = await mount([Bare], "#bare.2");
  expect(shownIn(host)).toEqual([true, true, false]);

  deck.go([0, 3]);
  expect(shownIn(host)).toEqual([true, true, true]);
});

test("naming a number carries the ones after it forward", async () => {
  class Mixed extends Slide {
    static path = "mixed";
    static steps = 5;
    render() {
      return jsx("div", {
        children: [jsx(Step, { n: 3, children: "a" }), jsx(Step, { children: "b" })],
      });
    }
  }

  const { deck, host } = await mount([Mixed], "#mixed.3");
  expect(shownIn(host)).toEqual([true, false]);

  deck.go([0, 4]);
  expect(shownIn(host)).toEqual([true, true]);
});

/** Everything so far appears and stays. Sometimes a thing should go away again. */
test("a range shows from the first number until the second, which is exclusive", async () => {
  class Ranged extends Slide {
    static path = "ranged";
    static steps = 5;
    render() {
      return jsx("div", { children: jsx(Step, { n: [2, 4], children: "a" }) });
    }
  }

  const { deck, host } = await mount([Ranged], "#ranged.1");
  expect(shownIn(host)).toEqual([false]);

  deck.go([0, 2]);
  expect(shownIn(host)).toEqual([true]);
  deck.go([0, 3]);
  expect(shownIn(host)).toEqual([true]);
  deck.go([0, 4]);
  expect(shownIn(host)).toEqual([false]);
});

/** The count is per slide, so a slide rebuilding itself must start counting again. */
test("a slide that redraws itself numbers its reveals the same way twice", async () => {
  class Bare extends Slide {
    static path = "bare";
    static steps = 3;
    mounted() {
      this.watch(votes);
    }
    render() {
      return jsx("div", {
        children: [String(votes.count), jsx(Step, { children: "a" }), jsx(Step, { children: "b" })],
      });
    }
  }

  const { host } = await mount([Bare], "#bare.2");
  expect(shownIn(host)).toEqual([true, true]);

  votes.cast();
  flushSync();

  expect(host.querySelector('[data-n="1"]')).toBeTruthy();
  expect(shownIn(host)).toEqual([true, true]);
});

/** The press that takes one thing away is the natural press to bring its replacement in. */
test("the reveal after a range arrives on the step the range leaves", async () => {
  class Swap extends Slide {
    static path = "swap";
    static steps = 4;
    render() {
      return jsx("div", {
        children: [jsx(Step, { n: [1, 3], children: "before" }), jsx(Step, { children: "after" })],
      });
    }
  }

  const { deck, host } = await mount([Swap], "#swap.1");
  expect(shownIn(host)).toEqual([true, false]);

  deck.go([0, 3]);
  expect(shownIn(host)).toEqual([false, true]);
});

/** The markup already says how many stops there are. Saying it again is a second truth. */
class Three extends Slide {
  static path = "three";
  render() {
    return jsx("div", {
      children: [
        jsx(Step, { children: "a" }),
        jsx(Step, { children: "b" }),
        jsx(Step, { children: "c" }),
      ],
    });
  }
}

class Plain extends Slide {
  static path = "plain";
  render() {
    return "nothing to reveal";
  }
}

test("a slide with three reveals and nothing declared takes three presses", async () => {
  const { deck, host } = await mount([Three, Plain]);

  deck.move(1);
  deck.move(1);
  deck.move(1);
  expect(shownIn(host)).toEqual([true, true, true]);
  expect(deck.snapshot().index).toBe(0);

  deck.move(1);
  expect(deck.snapshot().index).toBe(1);
});

/**
 * Going back has to land on the previous slide's *last* step, and that slide has never been
 * rendered, so nothing has counted its reveals yet.
 */
test("arrow-left into a slide never seen lands on its last step", async () => {
  const { deck, host } = await mount([Three, Plain], "#plain");

  deck.move(-1);
  await tick();

  expect(deck.snapshot().index).toBe(0);
  expect(shownIn(host)).toEqual([true, true, true]);
  expect(location.hash).toBe("#three.3");
});

test("End lands on the last step of the last slide", async () => {
  const { deck } = await mount([Plain, Three]);

  deck.go([1, Number.POSITIVE_INFINITY]);
  await tick();

  expect(location.hash).toBe("#three.3");
});

test("a deep link past the end is brought back once the slide has been drawn", async () => {
  const { host } = await mount([Three], "#three.9");

  expect(shownIn(host)).toEqual([true, true, true]);
  expect(location.hash).toBe("#three.3");
});

test("a number declared by hand still wins", async () => {
  class Padded extends Slide {
    static path = "padded";
    static steps = 6;
    render() {
      return jsx("div", { children: jsx(Step, { children: "a" }) });
    }
  }

  const { deck } = await mount([Padded, Plain]);
  for (let i = 0; i < 5; i++) deck.move(1);
  expect(deck.snapshot().index).toBe(0);

  deck.move(1);
  expect(deck.snapshot().index).toBe(1);
});

/**
 * A browser can refuse to run a transition — a tab that is not visible, one already running.
 * The callback that swaps the slide is inside the transition, so refusing it used to mean the
 * deck's position moved and the slide on screen did not.
 */
test("a transition the browser refuses still changes the slide", async () => {
  const { deck, host } = await mount([Three, Plain]);
  const refused = () => Promise.reject(new DOMException("aborted", "InvalidStateError"));
  Object.assign(document, {
    startViewTransition: () => ({
      ready: refused(),
      finished: refused(),
      updateCallbackDone: refused(),
      skipTransition() {},
    }),
  });

  try {
    deck.go([1, 0]);
    await tick();

    expect(host.textContent).toContain("nothing to reveal");
    expect(location.hash).toBe("#plain");
  } finally {
    Reflect.deleteProperty(document, "startViewTransition");
  }
});
