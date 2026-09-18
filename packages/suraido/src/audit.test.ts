import { expect, test, vi } from "vite-plus/test";

/**
 * These are the mistakes suraido.js otherwise makes in silence. Each test plants one and expects
 * to hear about it; the last one plants none and expects quiet, because a checker that cries
 * at a correct deck is worse than no checker.
 */
async function run(build: (api: any) => { slides: any[] }) {
  vi.resetModules();
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const api = await import("./deck.tsx");
  const { render } = await import("./dom.ts");
  const { jsx } = await import("./jsx-runtime.ts");

  const { slides } = build({ ...api, jsx });
  const host = document.createElement("div");
  document.body.append(host);
  render(jsx(api.Deck, { slides }), host);

  // audit() measures a frame later
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  const said = warn.mock.calls.map((c) => String(c[0])).join("\n");
  warn.mockRestore();
  host.remove();
  return said;
}

test("a slide wrapped in a function is called out, because it drops static steps and path", async () => {
  const said = await run(({ Slide, jsx }) => {
    class Real extends Slide {
      static path = "real";
      render() {
        return jsx("p", { children: "x" });
      }
    }
    const wrapped = (p: unknown) => jsx(Real, p as object);
    return { slides: [wrapped] };
  });
  expect(said).toContain("slides[0] is not a Slide subclass");
});

test("static steps that does not match the highest Step is called out, in both directions", async () => {
  const tooHigh = await run(({ Slide, Step, jsx }) => {
    class Slide1 extends Slide {
      static path = "high";
      static steps = 6;
      render() {
        return jsx(Step, { n: 1, children: "x" });
      }
    }
    return { slides: [Slide1] };
  });
  expect(tooHigh).toContain("key press(es) do nothing");

  const tooLow = await run(({ Slide, Step, jsx }) => {
    class Slide2 extends Slide {
      static path = "low";
      static steps = 1;
      render() {
        return jsx(Step, { n: 3, children: "x" });
      }
    }
    return { slides: [Slide2] };
  });
  expect(tooLow).toContain("never appear");
});

test("a correct deck says nothing", async () => {
  const said = await run(({ Slide, Step, jsx }) => {
    class Fine extends Slide {
      static path = "fine";
      static steps = 2;
      render() {
        return jsx("ul", { children: jsx(Step, { n: 1, as: "li", children: "x" }) });
      }
    }
    return { slides: [Fine] };
  });
  expect(said).toBe("");
});
