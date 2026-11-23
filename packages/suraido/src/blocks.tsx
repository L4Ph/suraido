import type { Child } from "./dom.ts";
import { Center } from "./layout.tsx";

/**
 * The shapes a deck writes again and again, written once.
 *
 * Every one of these was found by reading real decks: each had its own class name for the
 * same three lines of markup and the same four lines of CSS. The look comes from the tokens,
 * so a change of theme carries them along and a deck does not carry a stylesheet per shape.
 */

type Box = { class?: string; children?: Child; [attr: string]: unknown };
type Attrs = { class?: string; [attr: string]: unknown };

const cx = (...names: unknown[]) => names.filter(Boolean).join(" ");

/**
 * The small print: a source, a caveat, what the picture is. Sits under the thing it is about,
 * in the muted colour. A `<p>`, so it can go inside a list item or a column as it is.
 */
export function Aside({ class: cls, children, ...rest }: Box) {
  return (
    <p class={cx("suraido-aside", cls)} {...rest}>
      {children}
    </p>
  );
}

/**
 * A picture, a diagram, anything with a caption under it.
 *
 * `fit="contain"` keeps the whole thing inside `--suraido-figure-max` instead of filling the
 * width, which is what a diagram or a screenshot wants. `paper` puts a white plate behind it,
 * because a theme can have a coloured background and a diagram exported from a white tool
 * does not.
 */
export function Figure({
  caption,
  align,
  paper,
  fit = "width",
  max,
  class: cls,
  children,
  ...rest
}: Box & {
  caption?: Child;
  align?: "start" | "center";
  paper?: boolean;
  fit?: "width" | "contain";
  /** The height cap in canvas pixels. Only `fit="contain"` has anything to cap. */
  max?: number;
}) {
  return (
    <figure
      class={cx("suraido-figure", `is-${fit}`, align && `is-${align}`, paper && "is-paper", cls)}
      {...rest}
    >
      <div class="suraido-figure-media" style={max ? { maxHeight: `${max}px` } : undefined}>
        {children}
      </div>
      {caption != null && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** A title slide: one heading and the lines under it. */
export function Cover({
  title,
  byline,
  align,
  class: cls,
  children,
  ...rest
}: Box & {
  title: Child;
  byline?: Child | Child[];
  align?: "start" | "center";
}) {
  const lines = byline == null ? [] : Array.isArray(byline) ? byline : [byline];
  return (
    <Center class={cx("suraido-cover", align && `is-${align}`, cls)} {...rest}>
      <h1>{title}</h1>
      {lines.map((line) => (
        <p class="suraido-byline">{line}</p>
      ))}
      {children}
    </Center>
  );
}

/** The slide that says what the next part is called. A number, a heading, nothing else. */
export function Divider({
  align,
  class: cls,
  children,
  ...rest
}: Box & { align?: "start" | "center" }) {
  return (
    <Center class={cx("suraido-divider", align && `is-${align}`, cls)} {...rest}>
      {children}
    </Center>
  );
}

export type Point = {
  /** The thing being named — a few words, not a sentence. */
  term: Child;
  /** What is being said about it. */
  body: Child;
};

/**
 * Term over explanation, one after another: the shape most technical slides end up in.
 *
 * A `<dl>`, so a screen reader reads the pair as a pair instead of as bold text that happens
 * to sit above a sentence.
 */
export function Points({ items, class: cls, ...rest }: Attrs & { items: Point[] }) {
  return (
    <dl class={cx("suraido-points", cls)} {...rest}>
      {items.map((point) => (
        <div class="suraido-point">
          <dt>{point.term}</dt>
          <dd>{point.body}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * One column with a heading over it. Two of these inside `<Cols>` is the comparison slide.
 * The heading takes the accent colour, so it reads as a label rather than as a third level of
 * the outline.
 */
export function Side({ heading, class: cls, children, ...rest }: Box & { heading?: Child }) {
  return (
    <div class={cx("suraido-side", cls)} {...rest}>
      {heading != null && <h3>{heading}</h3>}
      {children}
    </div>
  );
}

/** One number worth reading from the back of the room, with what it counts under it. */
export function Stat({
  value,
  label,
  class: cls,
  ...rest
}: Attrs & { value: Child; label?: Child }) {
  return (
    <div class={cx("suraido-stat", cls)} {...rest}>
      <b>{value}</b>
      {label != null && <span>{label}</span>}
    </div>
  );
}

/** The one sentence a summary slide is built around. One per slide, or it stops being one. */
export function Lead({ class: cls, children, ...rest }: Box) {
  return (
    <p class={cx("suraido-lead", cls)} {...rest}>
      {children}
    </p>
  );
}

/**
 * Rows and columns. The first cell of a row is its name, so it is a `<th scope="row">` — the
 * table says what it means instead of leaving it to a `td:first-child` selector.
 */
export function Matrix({
  head,
  rows,
  class: cls,
  ...rest
}: Attrs & { head?: Child[]; rows: Child[][] }) {
  return (
    <table class={cx("suraido-matrix", cls)} {...rest}>
      {head && (
        <thead>
          <tr>
            {head.map((cell) => (
              <th scope="col">{cell}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row) => (
          <tr>{row.map((cell, i) => (i === 0 ? <th scope="row">{cell}</th> : <td>{cell}</td>))}</tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * A block of source. No colour: it is there to be read, not to be a screenshot.
 *
 * `size="s"` is for a block that shares the slide with something else. Keep the lines short —
 * a line past the block is cut, and nothing on screen says so.
 */
export function Code({
  label,
  size,
  class: cls,
  children,
  ...rest
}: Box & { label?: Child; size?: "s" | "m" }) {
  return (
    <figure class={cx("suraido-code", size === "s" && "is-s", cls)} {...rest}>
      {label != null && <figcaption>{label}</figcaption>}
      <pre>
        <code>{children}</code>
      </pre>
    </figure>
  );
}
