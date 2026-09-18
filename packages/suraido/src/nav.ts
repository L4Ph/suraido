export type Pos = [slide: number, step: number];
/** A slide's name in the URL. Slides without one are addressed by index. */
export type Paths = (string | undefined)[];

const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max);

/** As far as this slide goes, whatever that turns out to be once it has been drawn. */
export const LAST = Number.POSITIVE_INFINITY;

/** Move one step either way, spilling into the next slide at the ends. */
export function advance(
  [i, s]: Pos,
  dir: 1 | -1,
  steps: (i: number) => number,
  count: number,
): Pos {
  const next = s + dir;
  if (next >= 0 && next < steps(i)) return [i, next];
  const ni = i + dir;
  if (ni < 0 || ni >= count) return [i, s];
  // Going back lands on the previous slide's last stop — and that slide has not been drawn, so
  // how many stops it has is not known yet. Ask for the last one and let it be resolved once
  // it is on screen.
  return [ni, dir > 0 ? 0 : LAST];
}

/**
 * Reads `#intro.1` and `#0.1` alike. A matching name wins over an index.
 *
 * The step is taken as written. Whether a slide goes that far is only knowable once it has been
 * drawn, so bringing it back into range is the deck's job, afterwards.
 */
export function parseHash(hash: string, paths: Paths): Pos {
  const [token = "", rawStep] = hash.replace(/^#/, "").split(".");
  const named = paths.indexOf(token);
  const n = Number(token);
  const i = named >= 0 ? named : Number.isFinite(n) ? clamp(n, paths.length - 1) : 0;
  const s = Number(rawStep);
  return [i, Number.isFinite(s) ? Math.max(0, s) : 0];
}

export const formatHash = ([i, s]: Pos, paths: Paths) => `#${paths[i] ?? i}` + (s ? `.${s}` : "");
