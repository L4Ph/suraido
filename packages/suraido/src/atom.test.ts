import { expect, test } from "vite-plus/test";
import { atom } from "./atom.ts";
import { Component, render, type Child } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";

const tick = () => new Promise((r) => setTimeout(r, 0));

test("a value written from one place is seen from another", () => {
  const count = atom(0);
  expect(count.get()).toBe(0);
  count.set(3);
  expect(count.get()).toBe(3);
  count.update((n) => n + 1);
  expect(count.get()).toBe(4);
});

test("writing the same value notifies nobody", () => {
  const count = atom(1);
  let runs = 0;
  count.subscribe(() => runs++);
  count.set(1);
  expect(runs).toBe(0);
  count.set(2);
  expect(runs).toBe(1);
});

test("a watching component redraws when the atom changes", async () => {
  const count = atom(0);
  class Readout extends Component<{}, {}> {
    mounted() {
      this.watch(count);
    }
    render(): Child {
      return jsx("b", { children: String(count.get()) });
    }
  }
  const host = document.createElement("div");
  render(jsx(Readout, {}), host);
  await tick();
  expect(host.querySelector("b")!.textContent).toBe("0");

  count.set(7);
  await tick();
  expect(host.querySelector("b")!.textContent).toBe("7");
});

test("leaving drops the subscription, so the atom lets the component go", async () => {
  // Without this, every slide ever visited stays subscribed for the life of the deck, and
  // each write walks the lot of them.
  const count = atom(0);
  let redraws = 0;

  class Readout extends Component<{}, {}> {
    mounted() {
      this.watch(count);
    }
    render(): Child {
      redraws++;
      return jsx("b", { children: String(count.get()) });
    }
  }
  class Host extends Component<{}, { show: boolean }> {
    state = { show: true };
    render(): Child {
      return jsx("div", { children: this.state.show ? jsx(Readout, {}) : null });
    }
  }

  const el = document.createElement("div");
  const host = render(jsx(Host, {}), el).comp as Host;
  await tick();
  count.set(1);
  await tick();
  const whileMounted = redraws;
  expect(whileMounted).toBeGreaterThan(1);

  host.setState({ show: false });
  await tick();
  count.set(2);
  count.set(3);
  await tick();
  expect(redraws, "a component that has left must not be redrawn").toBe(whileMounted);
});
