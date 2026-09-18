import { expect, test } from "vite-plus/test";
import { Component, flushSync, render } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";

/** Every call the ref saw, so both the handing over and the taking back are visible. */
const seen: (Node | null)[] = [];

class Box extends Component<{}, { show: boolean; label: string }> {
  state = { show: true, label: "a" };
  render() {
    return jsx("div", {
      children: this.state.show
        ? jsx("p", { ref: (node: Node | null) => seen.push(node), children: this.state.label })
        : null,
    });
  }
}

function mount() {
  seen.length = 0;
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  return { comp: render(jsx(Box, {}), host).comp as Box, host };
}

test("a ref is handed the element it is written on", () => {
  const { host } = mount();
  expect(seen).toEqual([host.querySelector("p")]);
});

/** The element is kept across a redraw, so there is nothing to hand over again. */
test("a ref is not called again just because the slide redrew", () => {
  const { comp } = mount();
  comp.setState({ label: "b" });
  flushSync();
  expect(seen.length).toBe(1);
});

test("a ref is told when its element goes", () => {
  const { comp } = mount();
  const p = seen[0];

  comp.setState({ show: false });
  flushSync();

  expect(seen).toEqual([p, null]);
});

test("a ref is not written to the DOM as an attribute", () => {
  const { host } = mount();
  expect(host.querySelector("p")!.hasAttribute("ref")).toBe(false);
});
