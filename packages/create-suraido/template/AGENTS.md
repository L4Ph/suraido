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

```tsx
import { Slide, Step, Pad, Center, Cols, Full, deck } from "suraido.js";

class Intro extends Slide<{}, { count: number }> {
  static path = "intro"; // the URL becomes #intro; without it, the index is used
  static steps = 2; // how many key presses this slide absorbs
  state = { count: 0 };

  render() {
    return (
      <Pad>
        <h2>Heading</h2>
        <Step n={1}>
          <p>Appears on the second key press</p>
        </Step>
      </Pad>
    );
  }
}

deck([Intro]);
```

## Rules

- **`class`, not `className`.** Props are written straight to DOM attributes. Handlers go
  through `addEventListener`, so `onClick` becomes a `click` listener.
- **Put the classes themselves in the array passed to `deck()`.** Wrapping one, as in
  `(p) => <Intro {...p} />`, drops `static steps` and `static path`, which silently breaks
  reveals and URLs. Subclass instead when you need to pass props.
- **`render()` returns a single element.** Return several and only the first one is drawn.
- **Inside `<ul>` or `<ol>`, reveal with `<Step n={1} as="li">`.** Without `as` a `div` is
  wrapped around the `li` and `ul > li` stops matching.
- **You cannot branch on the current step inside `render()`.** Reveals go through `<Step>`
  only; changing step does not re-render (suraido.js just toggles an attribute).
- **`static steps` is the highest `<Step n>` on that slide, plus one.** Too high and a key
  press does nothing; too low and a `<Step>` never appears.
- **Slides must fit 1920x1080.** Anything past it is clipped with no warning, and the whole
  stage is scaled down so you cannot see that it happened. Measure the fit again whenever you
  add text.

## When something is wrong

suraido.js speaks up in the console about the mistakes it would otherwise make in silence: a slide
that overflows the canvas and is clipped, a `<Step>` that wrapped an `li` in a `div`, a
`static steps` that does not match the highest `<Step n>`, and a slide passed to `deck()`
that is not a class. **Read the console before assuming a deck is fine** — every one of these
looks correct on screen.

## State

`setState` **rebuilds that slide's DOM** — suraido.js does not diff. So:

- A `<video>` restarts, a focused `<input>` loses focus, and a transition in flight is cut off
- Restore what was lost in `updated()`, which runs right after the rebuild

```tsx
updated() {
  document.querySelector<HTMLInputElement>(".field")?.focus();
}
```

- Do not call `setState` while someone is typing. Leave the value in the DOM and move it into
  state only when the entry is committed.
- Start timers and rAF loops in `mounted()`, and **always stop them in `unmounted()`**.
- Crossing to another slide unmounts the old one and its state is gone. Values shared across
  slides belong in module scope or an external store.

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
}
```

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

`→ ↓ Space` forward, `← ↑` back, `Home` `End`, `f` fullscreen. Clicking advances;
shift-clicking goes back.

A button inside a slide must call `e.stopPropagation()`, or clicking it also advances the deck.

## Commands

```
npm run dev      development server
npm run build    production build
```
