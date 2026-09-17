/**
 * Every theme, as text, so a slide can swap them at runtime. Vite's ?inline gives the
 * processed stylesheet as a string instead of injecting it.
 */
import botanical from "suraido.js/themes/botanical.css?inline";
import dolch from "suraido.js/themes/dolch.css?inline";
import laser from "suraido.js/themes/laser.css?inline";
import nine009 from "suraido.js/themes/nine009.css?inline";
import noel from "suraido.js/themes/noel.css?inline";
import olivia from "suraido.js/themes/olivia.css?inline";

// noel first, because that is the one the deck loads.
export const THEMES: [name: string, css: string, note: string][] = [
  ["noel", noel, "pale aqua and blossom pink — soft"],
  ["olivia", olivia, "cream and salmon — elegant and safe"],
  ["nine009", nine009, "grey-beige and orange — an old calculator"],
  ["botanical", botanical, "deep green on cream — calm"],
  ["dolch", dolch, "black, grey, white — survives any lighting"],
  ["laser", laser, "magenta and cyan on deep purple — loud"],
];

const TAG = "showcase-theme";

export function applyTheme(css: string) {
  let el = document.getElementById(TAG);
  if (!el) {
    el = document.createElement("style");
    el.id = TAG;
    document.head.append(el);
  }
  el.textContent = css;
}
