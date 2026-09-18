# About this repository

Slides written with [suraido.js](https://github.com/L4Ph/suraido.js). You compose slides in JSX and
they render in a browser.

**This is not React.** JSX goes through suraido.js's own runtime and becomes DOM directly. Do not
bring React habits here.

## Layout

```
src/index.tsx    The slides and the deck() call. This is the whole deck
src/slides.css   Styles specific to this deck
index.html
```

As the deck grows, split slides into `src/slides/*.tsx`, import them in `index.tsx`, and list
them in `deck([...])`.

## Writing a slide

A slide is a function. It runs once, when the slide arrives, and returns what to draw.

```tsx
import { Center, Cols, deck, Full, Pad, slide, Step } from "suraido.js";

const Intro = slide({ path: "intro" }, () => (
  <Pad>
    <h2>Heading</h2>
    <Step>
      <p>Appears on the second key press</p>
    </Step>
  </Pad>
));

deck([Intro]);
```

`slide(() => …)` when there is nothing to say about the slide itself.

Return a function instead and it becomes the view, run again on every redraw. Because the setup
ran once, a plain `let` in it is state with the life of the slide.

```tsx
const Counter = slide({ path: "count" }, ({ update }) => {
  let n = 0;
  return () => (
    <button
      onClick={() => {
        n++;
        update();
      }}
    >
      Pressed {n} times
    </button>
  );
});
```

## Rules

- **`class`, not `className`.** Props are written straight to DOM attributes. Handlers go
  through `addEventListener`, so `onClick` becomes a `click` listener.
- **Put the classes themselves in the array passed to `deck()`.** Wrapping one, as in
  `(p) => <Intro {...p} />`, drops its statics, so reveals and URLs stop working. TypeScript
  rejects it. Subclass instead when you need to pass props.
- **`render()` returns a single element.** Return several and only the first one is drawn.
- **`<Step>` marks the element you wrote, it does not add one.** Inside a list, write the
  `<li>` yourself: `<Step><li>…</li></Step>` gives you `ul > li`. With nothing to mark — bare
  text — it builds a `div` to hold the mark.
- **Do not number the reveals.** A bare `<Step>` takes the one after the last, so inserting one
  does not renumber the rest. `<Step n={3}>` when you mean a particular place, and
  `<Step n={[2, 4]}>` to have something go away again — the second number is exclusive.
- **Do not declare how many stops a slide has.** It is counted from the reveals it draws.
  `static steps` is there to override that, which is rarely what you want.

## When something is wrong

Nothing is written to your console: the deck ships no diagnostics. Most of what used to be
reported cannot happen any more — there is no wrapper element to get wrong, no second place to
declare a count, and TypeScript rejects a slide that is not one.

What is left is the one thing only a browser can see: **a slide whose content runs past the
1920x1080 canvas is clipped, and nothing on screen shows it**, because the whole stage is
scaled down. Compare what you can read against the source, or cut the content.

## State

The setup runs once, so a `let` in it lasts exactly as long as the slide — and starts again when
you come back to it. Nothing is watching it, so say `update()` once you have changed one.

A redraw does not restart anything: the elements are kept and only what changed is written. A
`<video>` keeps playing, a field keeps what was typed in it and where the caret sits, and a
transition in flight keeps running. There is nothing to put back.

- **State that outlives a slide is a variable at module scope.** Nothing subscribes to it: two
  slides are never on screen at once, so the later one reads it when it is drawn.
- **Do not write a field's value back while someone is typing.** Leave it in the DOM and read it
  when the entry is committed, or the caret jumps to the end.

```tsx
let votes = 0;

const Poll = slide({ path: "poll" }, ({ update }) => () => (
  <button
    onClick={() => {
      votes++;
      update();
    }}
  >
    Vote — {votes}
  </button>
));

const Results = slide({ path: "results" }, () => <h1>{votes}</h1>); // several slides later
```

## What a slide is handed

Three things, and most slides need none of them.

```tsx
slide({ path: "clock" }, ({ update, signal, after }) => { … })
```

- `update()` — draw this slide again
- `signal` — an `AbortSignal`, aborted when the slide leaves. Hand it to `addEventListener` and
  there is nothing to take off again:
  `addEventListener("resize", measure, { signal })`. For anything else you started,
  `signal.addEventListener("abort", stop)`
- `after(fn)` — run once the next draw is on screen. Asked for during setup, that is the first
  draw. Use it for measuring, focusing, or reaching for an element

Reach an element with `ref`, which is handed the node once it exists and `null` once it does not:

```tsx
let canvas!: HTMLCanvasElement;
return <canvas ref={(el) => (canvas = el)} />;
```

## Styling

Every suraido.js style lives inside an `@layer`. **A plain selector here always wins** — no
specificity tricks, no `!important`.

Colors and sizes come from CSS variables. Reach for those before writing a selector.

```css
:root {
  --suraido-fg: #16181d;
  --suraido-bg: #fbfaf8;
  --suraido-accent: #2f6df6;
  --suraido-muted: #6b7280;
  --suraido-font: system-ui, sans-serif;
  --suraido-pad: 96px 120px;
  --suraido-gap: 72px;
  --suraido-h1: 92px;
  --suraido-h2: 60px;
  --suraido-text: 32px;
  --suraido-slide-fade: 260ms; /* how long a slide takes to come in */
}
```

Crossing to another slide slides in the direction the keys move. Stepping does not transition;
the `.step` fade covers that.

To change the whole palette at once, swap the `import "suraido.js/themes/<name>.css"` line
(`olivia`, `noel`, `nine009`, `botanical`, `dolch`, `laser`).

**Styles that belong to one slide can live in that slide, in a `<style>` element.** Only one
slide is mounted at a time, so the styles leave with it.

```tsx
render() {
  return (
    <Pad>
      <div class="stats">…</div>
      <style>{`.stats b { font-size: 96px; color: var(--suraido-accent); }`}</style>
    </Pad>
  );
}
```

`style={{ }}` works too, but it cannot express pseudo-classes, pseudo-elements, media queries
or descendant selectors. Keep it for injecting a single value, such as `width: ${pct}%`.

**Slides are drawn on a fixed 1920x1080 canvas that is scaled to the window.** Pixels are
always measured against that canvas, so there is no need for `clamp()`, `vw` or media queries.

`.stage`'s `position`, `transform` and `transform-origin` are machinery, not style. Leave them
alone.

## Position and controls

The URL is `#<slide>.<step>`, for example `#intro.2`. Reloading keeps the position.

`→ ↓ Space` forward, `← ↑` back, `Home` `End`, `f` fullscreen, `o` every slide at once
(`o` or `Escape` to put it away, click a thumbnail to go there). Clicking advances;
shift-clicking goes back.

Tapping the left quarter of the screen goes back, anywhere else goes forward — a phone has no
shift key, so without that a touch deck could only move one way.

Clicks on `a`, `button`, `input`, `select`, `textarea` and `label` do not turn the page, so
controls in a slide just work. For something clickable that is none of those, mark it with
`data-suraido-keep`.

## Commands

```
npm run dev      development server
npm run build    production build
```
