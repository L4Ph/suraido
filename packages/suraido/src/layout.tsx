import type { Child } from "./dom.ts";

/**
 * Only the arrangements every deck ends up writing again.
 * They take their look from the tokens, so a change of theme carries them along.
 * Class names start with `suraido.js-` and live inside an @layer: plain CSS always wins.
 */

type Box = { class?: string; children?: Child; [attr: string]: unknown };

const cx = (...names: unknown[]) => names.filter(Boolean).join(" ");

/** The body of a slide: full height, with `--suraido-pad` of padding. */
export function Pad({ class: cls, children, ...rest }: Box) {
  return (
    <section class={cx("suraido-pad", cls)} {...rest}>
      {children}
    </section>
  );
}

/** Pad, with its contents centred vertically. For covers and section dividers. */
export function Center({ class: cls, children, ...rest }: Box) {
  return (
    <section class={cx("suraido-pad", "suraido-center", cls)} {...rest}>
      {children}
    </section>
  );
}

/**
 * Columns — one per child.
 * Pass grid-template-columns through `ratio` to set the proportions, e.g. "2fr 1fr".
 */
export function Cols({ ratio, class: cls, children, ...rest }: Box & { ratio?: string }) {
  return (
    <div
      class={cx("suraido-cols", cls)}
      style={ratio ? { gridTemplateColumns: ratio, gridAutoFlow: "row" } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Ignores the padding and runs to the edges. A direct img / video child covers the slide.
 * To lay text over it, put an absolutely positioned element inside.
 */
export function Full({ class: cls, children, ...rest }: Box) {
  return (
    <section class={cx("suraido-full", cls)} {...rest}>
      {children}
    </section>
  );
}
