import { expect, test } from "vite-plus/test";
import { Component, render, type Child } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";

/**
 * watch() is the lifecycle half of subscribing: the component says what it cares about, and
 * the framework lets go on the way out. It knows nothing about stores — anything with
 * subscribe will do, which is why the store itself lives in its own package.
 */
function source() {
  const runs = new Set<() => void>();
  return {
    subscribers: runs,
    change: () => runs.forEach((r) => r()),
    subscribe(run: () => void) {
      runs.add(run);
      return () => runs.delete(run);
    },
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

test("a watching component redraws when the source changes", async () => {
  const from = source();
  let seen = 0;
  class Readout extends Component<{}, {}> {
    mounted() {
      this.watch(from);
    }
    render(): Child {
      seen++;
      return jsx("b", { children: String(seen) });
    }
  }
  const host = document.createElement("div");
  render(jsx(Readout, {}), host);
  await tick();
  expect(seen).toBe(1);

  from.change();
  await tick();
  expect(seen).toBe(2);
});

test("leaving lets the source go", async () => {
  const from = source();
  class Readout extends Component<{}, {}> {
    mounted() {
      this.watch(from);
    }
    render(): Child {
      return jsx("b", { children: "x" });
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
  expect(from.subscribers.size).toBe(1);

  host.setState({ show: false });
  await tick();
  // Left behind, the source would keep calling setState on a component nobody can see.
  expect(from.subscribers.size).toBe(0);
});
