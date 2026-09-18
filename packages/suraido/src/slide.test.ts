import { afterEach, expect, test } from "vite-plus/test";
import { Deck, Step, slide } from "./deck.tsx";
import { flushSync, render } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";

const tick = () => new Promise((r) => setTimeout(r, 0));

const decks: Deck[] = [];
async function mount(slides: any[], hash = "") {
  location.hash = hash;
  const host = document.body.appendChild(document.createElement("div"));
  const deck = render(jsx(Deck, { slides }), host).comp as Deck;
  decks.push(deck);
  await tick();
  return { deck, host };
}
afterEach(() => {
  for (const deck of decks.splice(0)) deck.unmounted();
  document.body.innerHTML = "";
});

const Blank = slide({ path: "blank" }, () => jsx("p", { children: "blank" }));

test("a slide that returns markup is drawn, and says where it lives", async () => {
  const { host } = await mount([Blank]);
  expect(host.querySelector("p")!.textContent).toBe("blank");
  expect(location.hash).toBe("#blank");
});

/** setup runs once, so a plain `let` is state with the life of the slide. */
test("a let in setup counts, because setup is not run again", async () => {
  const Counter = slide({ path: "count" }, ({ update }) => {
    let n = 0;
    return () => jsx("button", { onClick: () => ((n += 1), update()), children: `pressed ${n}` });
  });

  const { host } = await mount([Counter]);
  const button = host.querySelector("button")!;

  for (let i = 0; i < 3; i++) {
    button.dispatchEvent(new Event("click"));
    flushSync();
  }

  expect(button.textContent).toBe("pressed 3");
});

test("coming back to a slide starts it again", async () => {
  const Counter = slide({ path: "count" }, ({ update }) => {
    let n = 0;
    return () => jsx("button", { onClick: () => ((n += 1), update()), children: `pressed ${n}` });
  });

  const { deck, host } = await mount([Counter, Blank]);
  host.querySelector("button")!.dispatchEvent(new Event("click"));
  flushSync();
  expect(host.querySelector("button")!.textContent).toBe("pressed 1");

  deck.go([1, 0]);
  deck.go([0, 0]);
  await tick();

  expect(host.querySelector("button")!.textContent).toBe("pressed 0");
});

test("what was started with the signal is gone once the slide leaves", async () => {
  let ticks = 0;
  const Ticking = slide({ path: "tick" }, ({ signal }) => {
    addEventListener("suraido:test", () => (ticks += 1), { signal });
    return jsx("p", { children: "tick" });
  });

  const { deck } = await mount([Ticking, Blank]);
  dispatchEvent(new Event("suraido:test"));
  expect(ticks).toBe(1);

  deck.go([1, 0]);
  await tick();
  dispatchEvent(new Event("suraido:test"));

  expect(ticks).toBe(1);
});

test("after() runs with the drawn slide in place", async () => {
  const saw: (string | null)[] = [];
  const Measured = slide({ path: "measured" }, ({ after, update }) => {
    let label = "before";
    after(() => {
      saw.push(document.querySelector(".mark")?.textContent ?? null);
      label = "after";
      update();
    });
    return () => jsx("p", { class: "mark", children: label });
  });

  const { host } = await mount([Measured]);
  await tick();

  expect(saw).toEqual(["before"]);
  expect(host.querySelector(".mark")!.textContent).toBe("after");
});

test("reveals are numbered from the top on every draw", async () => {
  const Reveals = slide({ path: "reveals" }, ({ update }) => {
    let label = "a";
    return () =>
      jsx("div", {
        children: [
          jsx("button", { onClick: () => ((label = "b"), update()), children: label }),
          jsx(Step, { children: "one" }),
          jsx(Step, { children: "two" }),
        ],
      });
  });

  const { host } = await mount([Reveals], "#reveals.2");
  const ns = () => [...host.querySelectorAll(".step")].map((s) => s.getAttribute("data-n"));
  expect(ns()).toEqual(["1", "2"]);

  host.querySelector("button")!.dispatchEvent(new Event("click"));
  flushSync();

  expect(ns()).toEqual(["1", "2"]);
});
