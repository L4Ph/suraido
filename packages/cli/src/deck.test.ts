import { expect, test } from "vite-plus/test";
import { settled } from "./deck.ts";
import { DOCS } from "./docs.ts";

/**
 * A deck is walked one press at a time, which visits every reveal. On paper you want the slide
 * with all of them already showing, not one page per press.
 */
test("a page per slide is the last stop on each of them", () => {
  const walked = ["#intro", "#steps", "#steps.1", "#steps.2", "#layout", "#layout.1"];
  expect(settled(walked)).toEqual(["#intro", "#steps.2", "#layout.1"]);
});

test("a slide with nothing to reveal is still a page", () => {
  expect(settled(["#one", "#two", "#three"])).toEqual(["#one", "#two", "#three"]);
});

test("the very first position has no name yet, and still counts", () => {
  expect(settled(["", "#a", "#a.1"])).toEqual(["", "#a.1"]);
});

/** These ship with the CLI so that what they say is what the installed version does. */
test("every doc says what it is for and has something to say", () => {
  for (const [name, doc] of Object.entries(DOCS)) {
    expect(doc.description, name).toMatch(/\S/);
    expect(doc.body.length, name).toBeGreaterThan(200);
  }
});
