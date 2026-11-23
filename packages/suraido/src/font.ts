/**
 * The font a deck is in, loaded by its Fontsource id.
 *
 *   await font("ibm-plex-sans-jp");
 *
 * Naming a font is not loading it. A deck whose `--suraido-font` has no `@font-face` behind it
 * renders in whatever the machine happens to have, and since text takes its width from the
 * font while the canvas stays 1920x1080, what no longer fits is clipped with nothing on screen
 * to say so. It looks right where it was written and different where it is presented.
 *
 * No dependency: the metadata comes from the Fontsource API, which says what the family is
 * called and which release the files belong to, and the stylesheets come from their CDN. Both
 * are pinned to a version on jsDelivr, so a deck built today opens the same next year.
 */

type Meta = {
  family: string;
  weights: number[];
  /** A variable font ships one file for every weight, under the `:vf` name. */
  variable: boolean;
  /** The npm release, which is what the CDN path wants — not the font's own version. */
  npmVersion: string;
};

export type FontOptions = {
  /** Default `[400, 700]`. A variable font takes all of them at once, so this is ignored. */
  weights?: number[];
  /** The token to set. Default `--suraido-font`; `--suraido-font-mono` for a code font. */
  token?: string;
};

const API = "https://api.fontsource.org/v1/fonts/";
const CSS = "https://cdn.jsdelivr.net/fontsource/css/";
const FALLBACK = 'system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';

const said = (message: string) => console.warn(`suraido: ${message}`);

/** One lookup per id: a deck may name the same font twice. */
const known = new Map<string, Promise<Meta | undefined>>();

function metadata(id: string): Promise<Meta | undefined> {
  const hit = known.get(id);
  if (hit) return hit;

  const asking = (async () => {
    try {
      const res = await fetch(API + encodeURIComponent(id));
      if (!res.ok) {
        said(
          `no font "${id}" on Fontsource (${res.status}). The deck is being drawn in ` +
            `${FALLBACK.split(",")[0]} instead, so every width on it is a guess.`,
        );
        return undefined;
      }
      return (await res.json()) as Meta;
    } catch (error) {
      said(
        `could not reach Fontsource for "${id}" (${String(error)}). The deck is being drawn in ` +
          `a fallback font.`,
      );
      return undefined;
    }
  })();
  known.set(id, asking);
  return asking;
}

/**
 * Puts the stylesheet on the page and settles either way. A font that fails to load is a font
 * in the fallback: the deck still opens, which on stage is the only acceptable outcome.
 */
function stylesheet(href: string): Promise<CSSStyleSheet | null> {
  return new Promise((done) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    // CORS, so the rules can be read back: without it the response is opaque and cssRules
    // throws, and the family would have to be guessed from the metadata instead.
    link.crossOrigin = "anonymous";
    link.href = href;
    link.dataset.suraidoFont = "";
    link.addEventListener("load", () => done(link.sheet));
    link.addEventListener("error", () => done(null));
    document.head.appendChild(link);
  });
}

/**
 * The name the stylesheet actually declares. Asked rather than assumed: a variable font is
 * published as "Roboto Flex Variable" while the family in the metadata is "Roboto Flex", and
 * setting the token to the wrong one is the silent fallback this function exists to prevent.
 */
function declared(sheet: CSSStyleSheet | null): string | undefined {
  try {
    for (const rule of sheet?.cssRules ?? []) {
      const family = (rule as CSSFontFaceRule).style?.getPropertyValue("font-family");
      if (family) return family;
    }
  } catch {
    // A stylesheet from somewhere without CORS: fall back to what the metadata said.
  }
  return undefined;
}

/**
 * Load a font and say the deck is in it.
 *
 * `await` it before `deck([...])` and the first slide is drawn in the right font:
 *
 *   await font("ibm-plex-sans-jp");
 *   deck([...]);
 *
 * Without the await the deck opens in the fallback and moves to the loaded font a moment later.
 */
export async function font(id: string, options: FontOptions = {}): Promise<void> {
  const meta = await metadata(id);
  if (!meta) return;

  const release = `${id}${meta.variable ? ":vf" : ""}@${meta.npmVersion}`;
  const asked = options.weights ?? [400, 700];
  const weights = meta.variable ? [] : asked.filter((w) => meta.weights.includes(w));

  if (!meta.variable && weights.length === 0) {
    const only = meta.weights.includes(400) ? 400 : meta.weights[0];
    said(`"${id}" has no ${asked.join(" or ")}, so ${only} is being used.`);
    weights.push(only);
  }

  const files = meta.variable ? ["index"] : weights.map(String);
  const sheets = await Promise.all(files.map((file) => stylesheet(`${CSS}${release}/${file}.css`)));

  const family =
    declared(sheets.find(Boolean) ?? null) ?? `"${meta.family}${meta.variable ? " Variable" : ""}"`;
  document.documentElement.style.setProperty(
    options.token ?? "--suraido-font",
    `${family}, ${FALLBACK}`,
  );
}
