/**
 * The themes suraido.js ships. The CLI cannot read them at runtime, so it names them here to list
 * them in --help and to reject a typo. packages/suraido.js/src/themes.test.ts fails if this drifts
 * from what is actually in the package.
 */
export const THEMES = ["olivia", "noel", "nine009", "botanical", "dolch", "laser"] as const;

export const DEFAULT_THEME = "olivia";
export const DEFAULT_DIR = "my-deck";
