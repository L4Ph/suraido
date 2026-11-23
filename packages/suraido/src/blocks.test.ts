import { afterEach, expect, test } from "vite-plus/test";
import {
  Aside,
  Body,
  Code,
  Cols,
  Cover,
  Divider,
  Figure,
  Lead,
  Matrix,
  Pad,
  Points,
  Side,
  Stat,
} from "./index.ts";
import { render } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";

/**
 * These are the shapes four real decks each wrote by hand, under their own class name. What is
 * worth testing is not the CSS but the structure: whether the element a screen reader and a
 * stylesheet both need is actually there.
 */

afterEach(() => {
  document.body.innerHTML = "";
});

function mount(node: any) {
  document.body.innerHTML = "";
  const host = document.body.appendChild(document.createElement("div"));
  render(node, host);
  return host;
}

test("aside is a paragraph in the muted colour", () => {
  const host = mount(jsx(Aside, { children: "https://example.com" }));
  const p = host.querySelector("p.suraido-aside")!;
  expect(p.textContent).toBe("https://example.com");
});

test("aside keeps a class the deck passes it", () => {
  const host = mount(jsx(Aside, { class: "small", children: "x" }));
  expect(host.querySelector("p")!.className).toBe("suraido-aside small");
});

test("figure puts the caption under the media, in the figure", () => {
  const host = mount(
    jsx(Figure, {
      caption: "the whole thing",
      children: jsx("img", { src: "/a.png", alt: "" }),
    }),
  );

  const figure = host.querySelector("figure.suraido-figure")!;
  expect(figure.querySelector(".suraido-figure-media > img")).not.toBeNull();
  expect(figure.querySelector("figcaption")!.textContent).toBe("the whole thing");
});

test("figure says how the picture should fit and whether it needs a white plate", () => {
  const host = mount(
    jsx(Figure, { fit: "contain", align: "center", paper: true, max: 620, children: "x" }),
  );

  const figure = host.querySelector("figure")!;
  expect(figure.className).toBe("suraido-figure is-contain is-center is-paper");
  expect((figure.querySelector(".suraido-figure-media") as HTMLElement).style.maxHeight).toBe(
    "620px",
  );
});

test("figure without a caption has no figcaption to style", () => {
  const host = mount(jsx(Figure, { children: jsx("img", { src: "/a.png", alt: "" }) }));
  expect(host.querySelector("figcaption")).toBeNull();
});

test("a cover is a heading and one line per byline", () => {
  const host = mount(jsx(Cover, { title: "The title", byline: ["someone", "somewhere"] }));

  expect(host.querySelector(".suraido-cover h1")!.textContent).toBe("The title");
  expect([...host.querySelectorAll(".suraido-byline")].map((p) => p.textContent)).toEqual([
    "someone",
    "somewhere",
  ]);
});

test("a cover takes one byline without an array around it", () => {
  const host = mount(jsx(Cover, { title: "t", byline: "only one" }));
  expect(host.querySelectorAll(".suraido-byline").length).toBe(1);
});

test("cover and divider centre only when asked, because a long title reads better from the left", () => {
  const left = mount(jsx(Divider, { children: jsx("h1", { children: "part two" }) }));
  expect(left.querySelector(".suraido-divider")!.classList.contains("is-center")).toBe(false);

  const centred = mount(jsx(Divider, { align: "center", children: "part two" }));
  expect(centred.querySelector(".suraido-divider")!.classList.contains("is-center")).toBe(true);
});

test("points keep a term and its explanation together as a pair", () => {
  const host = mount(
    jsx(Points, {
      items: [
        { term: "when it fails", body: "retry three times" },
        { term: "when it stalls", body: jsx("code", { children: "heartbeat" }) },
      ],
    }),
  );

  const dl = host.querySelector("dl.suraido-points")!;
  expect(dl.querySelectorAll(".suraido-point").length).toBe(2);
  expect([...dl.querySelectorAll("dt")].map((n) => n.textContent)).toEqual([
    "when it fails",
    "when it stalls",
  ]);
  expect(dl.querySelectorAll("dt")[1]!.nextElementSibling!.tagName).toBe("DD");
  // Rich content survives: this is why the body is a child, not a string.
  expect(dl.querySelector("dd code")!.textContent).toBe("heartbeat");
});

test("side is a column whose heading is a heading", () => {
  const host = mount(jsx(Side, { heading: "before", children: jsx("p", { children: "x" }) }));
  expect(host.querySelector(".suraido-side > h3")!.textContent).toBe("before");
});

test("side without a heading adds nothing above the content", () => {
  const host = mount(jsx(Side, { children: jsx("p", { children: "x" }) }));
  expect(host.querySelector("h3")).toBeNull();
  expect(host.querySelector(".suraido-side > p")).not.toBeNull();
});

test("a stat is the number and what it counts, in that order", () => {
  const host = mount(jsx(Stat, { value: "45 min", label: "a full deploy" }));
  const stat = host.querySelector(".suraido-stat")!;
  expect(stat.querySelector("b")!.textContent).toBe("45 min");
  expect(stat.querySelector("span")!.textContent).toBe("a full deploy");
});

test("a lead is one paragraph, so it can sit above a list", () => {
  const host = mount(jsx(Lead, { children: "the premise" }));
  expect(host.querySelector("p.suraido-lead")!.textContent).toBe("the premise");
});

test("the first cell of a matrix row is the name of the row", () => {
  const host = mount(
    jsx(Matrix, {
      head: ["feature", "delivery", "on failure"],
      rows: [
        ["images", "queues", "retry"],
        ["mail", "inline", "sendgrid"],
      ],
    }),
  );

  expect([...host.querySelectorAll("thead th")].map((n) => n.getAttribute("scope"))).toEqual([
    "col",
    "col",
    "col",
  ]);
  const rows = [...host.querySelectorAll("tbody tr")];
  expect(rows.length).toBe(2);
  expect(rows[0]!.firstElementChild!.tagName).toBe("TH");
  expect(rows[0]!.firstElementChild!.getAttribute("scope")).toBe("row");
  expect(rows[0]!.querySelectorAll("td").length).toBe(2);
});

test("a matrix with no header row is still a table of named rows", () => {
  const host = mount(jsx(Matrix, { rows: [["mail", "inline"]] }));
  expect(host.querySelector("thead")).toBeNull();
  expect(host.querySelector("tbody th")!.textContent).toBe("mail");
});

test("code keeps the source as written, and only labels it when told to", () => {
  const source = "const a = 1;\n  const b = 2;";
  const host = mount(jsx(Code, { label: "src/app.ts", children: source }));

  expect(host.querySelector("figure.suraido-code figcaption")!.textContent).toBe("src/app.ts");
  expect(host.querySelector("pre > code")!.textContent).toBe(source);

  const bare = mount(jsx(Code, { children: "x" }));
  expect(bare.querySelector("figcaption")).toBeNull();
  expect(bare.querySelector("figure")!.className).toBe("suraido-code");
});

test("code small is a size, not a second component", () => {
  const host = mount(jsx(Code, { size: "s", children: "x" }));
  expect(host.querySelector("figure")!.className).toBe("suraido-code is-s");
});

test("cols lines its columns up where it is told to", () => {
  const host = mount(jsx(Cols, { align: "center", children: ["a", "b"] }));
  expect((host.querySelector(".suraido-cols") as HTMLElement).style.alignItems).toBe("center");
});

test("cols keeps the proportions and the alignment together", () => {
  const host = mount(jsx(Cols, { ratio: "2fr 1fr", align: "center", children: ["a", "b"] }));
  const { style } = host.querySelector(".suraido-cols") as HTMLElement;
  expect(style.gridTemplateColumns).toBe("2fr 1fr");
  expect(style.alignItems).toBe("center");
});

test("a body is the part of the slide under the heading", () => {
  const host = mount(
    jsx(Pad, {
      children: [jsx("h2", { children: "heading" }), jsx(Body, { children: "rest" })],
    }),
  );
  expect(host.querySelector(".suraido-pad > .suraido-body")!.textContent).toBe("rest");
});
