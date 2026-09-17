import { expect, test, vi } from "vite-plus/test";
import { MOVE, type Move } from "./deck.tsx";
import { presenter } from "./presenter.ts";

/** A window.open that hands back a document we can read, since a test has no pop-ups. */
function stubWindow() {
  const doc = document.implementation.createHTMLDocument("presenter");
  const listeners: Record<string, ((e: any) => void)[]> = {};
  const win = {
    document: doc,
    addEventListener: (type: string, fn: (e: any) => void) => (listeners[type] ??= []).push(fn),
    setInterval: () => 1,
    clearInterval: () => {},
    fire: (type: string, e: unknown) => listeners[type]?.forEach((fn) => fn(e)),
  };
  vi.spyOn(window, "open").mockReturnValue(win as unknown as Window);
  return win;
}

const move = (over: Partial<Move> = {}): Move => ({
  index: 1,
  step: 2,
  steps: 4,
  total: 15,
  path: "#shape.2",
  notes: "Land on: state on the class.",
  next: { path: "#steps", notes: "Nothing moves as these appear." },
  ...over,
});

const press = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key }));
const announce = (m: Move) => document.dispatchEvent(new CustomEvent(MOVE, { detail: m }));
/** BroadcastChannel delivers on a later task, so give it one. */
const delivered = () => new Promise((r) => setTimeout(r, 0));

test("the window opens showing where the deck already is, not a blank page", () => {
  presenter({ channel: `t${Math.random()}` });
  announce(move()); // the deck moved before anyone opened the window
  const win = stubWindow();
  press("p");

  const text = (id: string) => win.document.getElementById(id)?.textContent;
  expect(text("notes")).toBe("Land on: state on the class.");
  expect(text("at")).toBe("2 / 15  ·  step 3/4");
  expect(text("where")).toBe("#shape.2");
  expect(text("next")).toBe("Nothing moves as these appear.");
});

test("it follows the deck as it moves", async () => {
  presenter({ channel: `t${Math.random()}` });
  const win = stubWindow();
  press("p");
  announce(move({ path: "#steps", notes: "Second position.", index: 2, steps: 1, step: 0 }));
  await delivered();

  expect(win.document.getElementById("notes")?.textContent).toBe("Second position.");
  // A slide with a single step should not advertise one.
  expect(win.document.getElementById("at")?.textContent).toBe("3 / 15");
});

test("the last slide says so rather than offering a next", () => {
  presenter({ channel: `t${Math.random()}` });
  announce(move({ next: undefined }));
  const win = stubWindow();
  press("p");
  expect(win.document.getElementById("next-label")?.textContent).toBe("Last slide");
});

test("a blocked pop-up says why instead of doing nothing", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(window, "open").mockReturnValue(null);
  presenter({ channel: `t${Math.random()}` });
  press("p");
  expect(warn.mock.calls.map((c) => String(c[0])).join()).toContain("blocked");
  warn.mockRestore();
});
