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
 * `align` is how the tops of the columns line up: "start" for text next to text, "center"
 * when one column holds a picture and the other is shorter.
 */
export function Cols({
  ratio,
  align,
  class: cls,
  children,
  ...rest
}: Box & {
  ratio?: string;
  align?: "start" | "center" | "end" | "stretch";
}) {
  const style: Record<string, string> = {};
  if (ratio) Object.assign(style, { gridTemplateColumns: ratio, gridAutoFlow: "row" });
  if (align) style.alignItems = align;
  return (
    <div
      class={cx("suraido-cols", cls)}
      style={Object.keys(style).length ? style : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * What is under the heading: takes the rest of the slide and centres it in what is left.
 * Inside `<Pad>`, after the `<h2>`. Content of different heights then sits at the same place
 * from slide to slide instead of hanging from the heading.
 */
export function Body({ class: cls, children, ...rest }: Box) {
  return (
    <div class={cx("suraido-body", cls)} {...rest}>
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
