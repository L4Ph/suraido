import { expect, test, vi } from "vite-plus/test";

/**
 * A regression test for opening a URL that already carries a step.
 * The bug this covers passed when reached through a hash change, so always look at the
 * first render from cold.
 *
 * The step of the slide being drawn lives in module scope, so each position resets the modules
 * and imports them again — with the URL set first.
 */
async function mountDeck(hash: string, kind: "points" | "list" = "points") {
  location.hash = hash;
  vi.resetModules();

  const { slide, Step, Deck } = await import("./deck.tsx");
  const { render } = await import("./dom.ts");
  const { jsx } = await import("./jsx-runtime.ts");

  const Points = slide({ path: "points", steps: 3 }, () =>
    jsx(Step, { n: 1, children: jsx(Step, { n: 2, children: "x" }) }),
  );

  const List = slide({ path: "list", steps: 3 }, () =>
    jsx("ul", {
      children: [
        jsx(Step, { n: 1, children: jsx("li", { children: "a" }) }),
        jsx(Step, { n: 2, children: jsx("li", { children: "b" }) }),
      ],
    }),
  );

  const host = document.createElement("div");
  render(jsx(Deck, { slides: [kind === "list" ? List : Points] }), host);
  await new Promise((r) => setTimeout(r, 0));
  return {
    host,
    shown: [...host.querySelectorAll(".step")].map((e) => e.hasAttribute("data-shown")),
    hash: location.hash,
  };
}

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

test("transition: false skips document.startViewTransition and swaps immediately", async () => {
  location.hash = "#a";
  vi.resetModules();

  const { slide, deck } = await import("./deck.tsx");
  const { jsx } = await import("./jsx-runtime.ts");

  const startViewTransition = vi.fn((cb: () => void) => {
    cb();
    return {
      ready: Promise.resolve(),
      finished: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
      skipTransition() {},
    };
  });
  Object.defineProperty(document, "startViewTransition", {
    value: startViewTransition,
    configurable: true,
    writable: true,
  });

  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);

  try {
    const A = slide({ path: "a" }, () => jsx("p", { children: "A" }));
    const B = slide({ path: "b" }, () => jsx("p", { children: "B" }));
    const ctx = deck([A, B], { transition: false });
    await new Promise((r) => setTimeout(r, 0));

    ctx.go("b");
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(root.textContent).toContain("B");
  } finally {
    root.remove();
    Reflect.deleteProperty(document, "startViewTransition");
  }
});
