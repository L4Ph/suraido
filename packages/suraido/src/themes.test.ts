import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

/**
 * Slides land on a washed-out projector. A low-contrast theme can look lovely on the
 * laptop and be unreadable in the room, so hold it to a number.
 */

// Vitest stubs CSS out with an empty string by default, so ?raw and ?inline give nothing.
// This only inspects the source, so read the files.
const DIR = join(dirname(fileURLToPath(import.meta.url)), "themes");
const themes = Object.fromEntries(
  readdirSync(DIR)
    .filter((f) => f.endsWith(".css"))
    .map((f) => [f, readFileSync(join(DIR, f), "utf8")]),
);

const srgb = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function luminance(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const [r, g, b] = [0, 2, 4].map((i) => srgb(parseInt(full.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function tokens(css: string) {
  const out: Record<string, string> = {};
  for (const [, k, v] of css.matchAll(/--suraido-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out[k] = v;
  return out;
}

const entries = Object.entries(themes);

test("themes exist and carry every token the contrast rules need", () => {
  expect(entries.length).toBeGreaterThan(0);
  for (const [file, css] of entries) {
    const t = tokens(css);
    for (const key of ["bg", "fg", "accent", "accent-2", "muted"]) {
      expect(t[key], `${file}: --suraido-${key} is missing`).toBeTruthy();
    }
  }
});

for (const [file, css] of entries) {
  const name = file;

  test(`${name} carries enough contrast for the room`, () => {
    const t = tokens(css);
    const ratio = (k: string) => contrast(t[k], t.bg);

    // Body text, at WCAG AAA, with room for what a projector washes away.
    expect(ratio("fg"), `${name}: fg/bg`).toBeGreaterThanOrEqual(7);
    // Secondary text, at AA.
    expect(ratio("muted"), `${name}: muted/bg`).toBeGreaterThanOrEqual(4.5);
    // Headings, rules and big figures: the bar for large text and shapes.
    for (const k of ["accent", "accent-2"]) {
      expect(ratio(k), `${name}: ${k}/bg`).toBeGreaterThanOrEqual(3);
    }
  });
}

test("create-suraido offers exactly the themes that ship", async () => {
  // The CLI has to name the themes to list them in --help and reject a typo, and it cannot
  // read them at runtime. This is what keeps that list honest.
  const { THEMES } = await import("../../create-suraido/src/themes.ts");
  const shipped = Object.keys(themes).map((f) => f.replace(/\.css$/, ""));
  const byName = (a: string, b: string) => a.localeCompare(b);
  expect([...THEMES].sort(byName)).toEqual(shipped.sort(byName));
});
