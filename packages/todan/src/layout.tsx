import type { Child } from "./dom.ts";

/**
 * Only the arrangements every deck ends up writing again.
 * They take their look from the tokens, so a change of theme carries them along.
 * Class names start with `todan-` and live inside an @layer: plain CSS always wins.
 */

type Box = { class?: string; children?: Child; [attr: string]: unknown };

const cx = (...names: unknown[]) => names.filter(Boolean).join(" ");

/** The body of a slide: full height, with `--todan-pad` of padding. */
export function Pad({ class: cls, children, ...rest }: Box) {
  return (
    <section class={cx("todan-pad", cls)} {...rest}>
      {children}
    </section>
  );
}

/** Pad, with its contents centred vertically. For covers and section dividers. */
export function Center({ class: cls, children, ...rest }: Box) {
  return (
    <section class={cx("todan-pad", "todan-center", cls)} {...rest}>
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
      class={cx("todan-cols", cls)}
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
    <section class={cx("todan-full", cls)} {...rest}>
      {children}
    </section>
  );
}
