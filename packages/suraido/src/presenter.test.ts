import { afterEach, expect, test, vi } from "vite-plus/test";
import type { At, DeckContext, SlideInfo } from "./deck.tsx";
import { presenter } from "./presenter.ts";

/** A window.open that hands back a document we can read, since a test has no pop-ups. */
function stubWindow() {
  const doc = document.implementation.createHTMLDocument("presenter");
  const win = {
    document: doc,
    addEventListener: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
  };
  vi.spyOn(window, "open").mockReturnValue(win as unknown as Window);
  return win;
}

/** A deck the plugin can talk to, without mounting one. */
function fakeDeck(slides: SlideInfo[]) {
  const listeners = new Set<(at: At) => void>();
  const moved: (1 | -1)[] = [];
  let at: At = {
    index: 0,
    step: 0,
    steps: slides[0]!.steps,
    total: slides.length,
    path: slides[0]!.path,
  };
  return {
    moved,
    settle(next: Partial<At>) {
      at = { ...at, ...next };
      for (const run of listeners) run(at);
    },
    context: {
      get at() {
        return at;
      },
      slides,
      go: () => {},
      move: (by: 1 | -1) => moved.push(by),
      on: (_e, run) => (listeners.add(run), () => listeners.delete(run)),
    } satisfies DeckContext,
  };
}

const SLIDES: SlideInfo[] = [
  { path: "#shape", steps: 4, notes: "Land on: state on the class." },
  { path: "#steps", steps: 1, notes: "Nothing moves as these appear." },
];

const press = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key }));

/**
 * Attach, and take it off again when the test ends. Every presenter binds keydown on the one
 * window these tests share, so one left behind answers the next test's key press.
 */
function attach(deck: DeckContext) {
  const key = `k${Math.random()}`;
  const off = presenter({ key, channel: `t${Math.random()}` })(deck)!;
  detachers.push(off);
  return { open: () => press(key), off };
}
const detachers: (() => void)[] = [];
afterEach(() => {
  for (const off of detachers.splice(0)) off();
});
/** BroadcastChannel delivers on a later task, so give it one. */
const delivered = () => new Promise((r) => setTimeout(r, 0));

test("the window opens showing where the deck already is, not a blank page", () => {
  const deck = fakeDeck(SLIDES);
  const it = attach(deck.context);
  const win = stubWindow();
  it.open();

  const text = (id: string) => win.document.getElementById(id)?.textContent;
  expect(text("notes")).toBe("Land on: state on the class.");
  expect(text("at")).toBe("1 / 2  ·  step 1/4");
  expect(text("where")).toBe("#shape");
  expect(text("next")).toBe("Nothing moves as these appear.");
});

test("it follows the deck as it moves", async () => {
  const deck = fakeDeck(SLIDES);
  const it = attach(deck.context);
  const win = stubWindow();
  it.open();
  deck.settle({ index: 1, step: 0, steps: 1, path: "#steps" });
  await delivered();

  expect(win.document.getElementById("notes")?.textContent).toBe("Nothing moves as these appear.");
  // A slide with a single step should not advertise one.
  expect(win.document.getElementById("at")?.textContent).toBe("2 / 2");
  expect(win.document.getElementById("next-label")?.textContent).toBe("Last slide");
});

test("detaching stops it listening, so a closed deck is not still driving a window", () => {
  const deck = fakeDeck(SLIDES);
  const it = attach(deck.context);
  it.off();
  const win = stubWindow();
  it.open(); // the key is no longer bound
  expect(win.document.getElementById("notes")).toBe(null);
});

test("a blocked pop-up says why instead of doing nothing", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(window, "open").mockReturnValue(null);
  attach(fakeDeck(SLIDES).context).open();
  expect(warn.mock.calls.map((c) => String(c[0])).join()).toContain("blocked");
  warn.mockRestore();
});
