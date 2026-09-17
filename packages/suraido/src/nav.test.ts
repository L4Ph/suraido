import { expect, test } from "vite-plus/test";
import { advance, formatHash, parseHash, type Paths, type Pos } from "./nav.ts";

const steps = (i: number) => [1, 3, 2][i];
const fwd = (p: Pos) => advance(p, 1, steps, 3);
const back = (p: Pos) => advance(p, -1, steps, 3);

const unnamed: Paths = [undefined, undefined, undefined];
const named: Paths = ["intro", "body", undefined];

test("forward walks steps then spills to the next slide", () => {
  expect(fwd([0, 0])).toEqual([1, 0]);
  expect(fwd([1, 0])).toEqual([1, 1]);
  expect(fwd([1, 2])).toEqual([2, 0]);
});

test("backward lands on the previous slide last step", () => {
  expect(back([2, 0])).toEqual([1, 2]);
  expect(back([1, 0])).toEqual([0, 0]);
});

test("ends are sticky", () => {
  expect(back([0, 0])).toEqual([0, 0]);
  expect(fwd([2, 1])).toEqual([2, 1]);
});

test("positional hashes round-trip and clamp garbage", () => {
  expect(formatHash([1, 2], unnamed)).toBe("#1.2");
  expect(formatHash([1, 0], unnamed)).toBe("#1");
  expect(parseHash("#1.2", unnamed, steps)).toEqual([1, 2]);
  expect(parseHash("#9.9", unnamed, steps)).toEqual([2, 1]);
  expect(parseHash("", unnamed, steps)).toEqual([0, 0]);
  expect(parseHash("#nope", unnamed, steps)).toEqual([0, 0]);
});

test("named slides win over their index, unnamed ones fall back to it", () => {
  expect(formatHash([0, 0], named)).toBe("#intro");
  expect(formatHash([1, 2], named)).toBe("#body.2");
  expect(formatHash([2, 1], named)).toBe("#2.1"); // an unnamed slide keeps its index
  expect(parseHash("#body.2", named, steps)).toEqual([1, 2]);
  expect(parseHash("#intro", named, steps)).toEqual([0, 0]);
});

test("a named link survives reordering the deck", () => {
  const before: Paths = ["intro", "body", undefined];
  const after: Paths = [undefined, "intro", "body"]; // a slide was inserted at the front
  const link = formatHash([0, 0], before);
  expect(link).toBe("#intro");
  expect(parseHash(link, after, steps)).toEqual([1, 0]); // the index moved, but the link still lands
});
