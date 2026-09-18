import { expect, test } from "vite-plus/test";
import { Component, flushSync, render } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";

class Form extends Component<{}, { sent: string[]; n: number }> {
  state = { sent: [] as string[], n: 0 };
  render() {
    return jsx("div", {
      children: [
        jsx("input", { class: "field", placeholder: "type" }),
        jsx("p", { id: "count", children: String(this.state.n) }),
        jsx("ul", { children: this.state.sent.map((s) => jsx("li", { children: s })) }),
      ],
    });
  }
}

function mount() {
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  const comp = render(jsx(Form, {}), host).comp as Form;
  return { comp, host };
}

test("what someone has typed survives a redraw, and so does the focus", () => {
  const { comp, host } = mount();
  const field = host.querySelector<HTMLInputElement>(".field")!;

  field.focus();
  field.value = "half a sentence";

  comp.setState({ n: 1 });
  flushSync();

  expect(host.querySelector(".field")).toBe(field); // the very same element
  expect(field.value).toBe("half a sentence");
  expect(document.activeElement).toBe(field);
});

test("the value that did change is written, in place", () => {
  const { comp, host } = mount();
  const p = host.querySelector("#count")!;
  const text = p.firstChild;

  comp.setState({ n: 7 });
  flushSync();

  expect(p.textContent).toBe("7");
  expect(host.querySelector("#count")).toBe(p);
  expect(p.firstChild).toBe(text); // even the text node is the same one
});

test("children appearing are added, and leaving are removed", () => {
  const { comp, host } = mount();

  comp.setState({ sent: ["a", "b"] });
  flushSync();
  expect([...host.querySelectorAll("li")].map((l) => l.textContent)).toEqual(["a", "b"]);

  comp.setState({ sent: ["a"] });
  flushSync();
  expect([...host.querySelectorAll("li")].map((l) => l.textContent)).toEqual(["a"]);
});

class Shape extends Component<{}, { tall: boolean }> {
  state = { tall: false };
  render() {
    return this.state.tall
      ? jsx("h1", { id: "x", children: "big" })
      : jsx("p", { id: "x", class: "small", children: "small" });
  }
}

test("a different element is replaced, and the attributes it had do not linger", () => {
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  const comp = render(jsx(Shape, {}), host).comp as Shape;

  expect(host.querySelector("p.small")).toBeTruthy();

  comp.setState({ tall: true });
  flushSync();

  expect(host.querySelector("p")).toBe(null);
  expect(host.querySelector("h1")!.textContent).toBe("big");
  expect(host.querySelector("h1")!.getAttribute("class")).toBe(null);
});

class Toggle extends Component<{}, { on: boolean; hits: number }> {
  state = { on: false, hits: 0 };
  render() {
    return jsx("button", {
      class: this.state.on ? "on" : null,
      onClick: () => this.setState((s) => ({ hits: s.hits + 1 })),
      children: String(this.state.hits),
    });
  }
}

test("a handler replaced on every render does not stack up", () => {
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  const comp = render(jsx(Toggle, {}), host).comp as Toggle;
  const button = host.querySelector("button")!;

  button.click();
  flushSync();
  button.click();
  flushSync();

  // Three would mean the first render's listener is still attached alongside the second's.
  expect(comp.state.hits).toBe(2);
});

test("an attribute that goes away is taken off", () => {
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  const comp = render(jsx(Toggle, {}), host).comp as Toggle;
  const button = host.querySelector("button")!;

  comp.setState({ on: true });
  flushSync();
  expect(button.getAttribute("class")).toBe("on");

  comp.setState({ on: false });
  flushSync();
  expect(button.getAttribute("class")).toBe(null);
});

class Bar extends Component<{}, { pct: number; label: string }> {
  state = { pct: 40, label: "a" };
  render() {
    return jsx("div", {
      children: [
        jsx("div", { class: "bar", style: { width: `${this.state.pct}%` } }),
        jsx("span", { children: this.state.label }),
      ],
    });
  }
}

/**
 * An inline style object is a different object every render even when it says the same thing.
 * Writing it back clears cssText first, which would restart a transition on an element that
 * did not change — the very thing not rebuilding was supposed to protect.
 */
test("an inline style that says the same thing is not written again", () => {
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  const comp = render(jsx(Bar, {}), host).comp as Bar;
  const bar = host.querySelector<HTMLElement>(".bar")!;

  // Something the framework cannot know about, sitting on the same element.
  bar.style.setProperty("--live", "1");

  comp.setState({ label: "b" });
  flushSync();

  expect(bar.style.getPropertyValue("--live")).toBe("1");
  expect(bar.style.width).toBe("40%");
});

test("an inline style that did change is written", () => {
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  const comp = render(jsx(Bar, {}), host).comp as Bar;
  const bar = host.querySelector<HTMLElement>(".bar")!;

  comp.setState({ pct: 80 });
  flushSync();

  expect(bar.style.width).toBe("80%");
});

test("changing one style property leaves the rest of the element's style alone", () => {
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  const comp = render(jsx(Bar, {}), host).comp as Bar;
  const bar = host.querySelector<HTMLElement>(".bar")!;

  bar.style.setProperty("--live", "1");

  comp.setState({ pct: 80 });
  flushSync();

  expect(bar.style.width).toBe("80%");
  expect(bar.style.getPropertyValue("--live")).toBe("1");
});
