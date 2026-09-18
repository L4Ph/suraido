import { expect, test } from "vite-plus/test";
import { Component, render, type Child } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";

const h = (type: any, props: Record<string, any> = {}, ...kids: any[]) =>
  jsx(type, kids.length ? { ...props, children: kids.length === 1 ? kids[0] : kids } : props);

const root = () => document.createElement("div");
const tick = () => new Promise((r) => setTimeout(r, 0));

class Box extends Component<{ label: string }, { n: number }> {
  state = { n: 0 };
  render(): Child {
    return h(
      "div",
      {},
      h("img", { src: "/cat.png" }),
      h("span", {}, `${this.props.label}:${this.state.n}`),
      this.state.n > 0 ? h("p", {}, "extra") : null,
    );
  }
}

test("setState re-renders the subtree", async () => {
  const el = root();
  const box = render(h(Box, { label: "a" }), el).comp as Box;
  expect(el.querySelector("span")!.textContent).toBe("a:0");

  box.setState({ n: 1 });
  await tick();
  expect(el.querySelector("span")!.textContent).toBe("a:1");
});

test("setState leaves alone the nodes it did not change", async () => {
  // The reason a <video> keeps playing and an <input> keeps its focus: the element is the one
  // that was always there, not a new one that looks like it.
  const el = root();
  const box = render(h(Box, { label: "a" }), el).comp as Box;
  const img = el.querySelector("img");

  box.setState({ n: 1 });
  await tick();
  expect(el.querySelector("img")).toBe(img);
});

test("a child can appear and disappear without disturbing its siblings", async () => {
  const el = root();
  const box = render(h(Box, { label: "a" }), el).comp as Box;
  expect(el.querySelector("p")).toBe(null);

  box.setState({ n: 1 });
  await tick();
  expect(el.querySelector("p")!.textContent).toBe("extra");
  expect(el.querySelector("span")!.textContent).toBe("a:1");

  box.setState({ n: 0 });
  await tick();
  expect(el.querySelector("p")).toBe(null);
  expect(el.querySelector("span")!.textContent).toBe("a:0");
});

test("handlers survive the rebuild they caused, and do not stack", async () => {
  class Counter extends Component<{}, { n: number }> {
    state = { n: 0 };
    render(): Child {
      return h(
        "button",
        { onClick: () => this.setState((s) => ({ n: s.n + 1 })) },
        String(this.state.n),
      );
    }
  }
  const el = root();
  render(h(Counter, {}), el);
  for (let i = 0; i < 3; i++) {
    el.querySelector("button")!.dispatchEvent(new Event("click"));
    await tick();
  }
  // Rebuilt every time, yet it counts the presses. Doubled listeners would reach 7.
  expect(el.querySelector("button")!.textContent).toBe("3");
});

test("lists shrink correctly and dropped props are gone", () => {
  const el = root();
  const list = (items: string[], cls?: string) =>
    h("ul", { class: cls }, ...items.map((t) => h("li", {}, t)));

  render(list(["a", "b", "c"], "x"), el);
  expect(el.querySelectorAll("li").length).toBe(3);
  expect(el.querySelector("ul")!.getAttribute("class")).toBe("x");

  render(list(["a"], undefined), el);
  expect(el.querySelectorAll("li").length).toBe(1);
  expect(el.querySelector("ul")!.hasAttribute("class")).toBe(false);
});

test("updated() fires after the DOM has been rebuilt, so focus can be restored", async () => {
  const el = root();
  const seen: string[] = [];
  class Form extends Component<{}, { n: number }> {
    state = { n: 0 };
    updated() {
      // the new DOM must already be in place by now
      seen.push(el.querySelector("span")!.textContent!);
    }
    render(): Child {
      return h("div", {}, h("input", {}), h("span", {}, String(this.state.n)));
    }
  }
  const form = render(h(Form, {}), el).comp as Form;
  expect(seen).toEqual([]); // not called on the first mount

  form.setState({ n: 1 });
  await tick();
  expect(seen).toEqual(["1"]);

  form.setState({ n: 2 });
  await tick();
  expect(seen).toEqual(["1", "2"]);
});

test("unmounted() fires when a component leaves the tree", async () => {
  const el = root();
  const log: string[] = [];
  class Timer extends Component<{}, {}> {
    mounted() {
      log.push("in");
    }
    unmounted() {
      log.push("out");
    }
    render(): Child {
      return h("i", {}, "tick");
    }
  }
  class Host extends Component<{}, { show: boolean }> {
    state = { show: true };
    render(): Child {
      return h("div", {}, this.state.show ? h(Timer, {}) : null);
    }
  }
  const host = render(h(Host, {}), el).comp as Host;
  await tick();
  expect(log).toEqual(["in"]);

  host.setState({ show: false });
  await tick();
  expect(log).toEqual(["in", "out"]);
  expect(el.querySelector("i")).toBe(null);
});
