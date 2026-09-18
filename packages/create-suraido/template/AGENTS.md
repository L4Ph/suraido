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

`setState` re-runs `render()` and the result is put onto the DOM that is already there, so an
element changes only when something about it changed. Focus, a half-typed word, a playing
`<video>` and a transition in flight all survive, because the elements holding them are the ones
that were always there.

`updated()` still runs right after a redraw, for work that needs the new DOM in place —
scrolling something into view, measuring it.

```tsx
updated() {
  this.$el.querySelector(".answers")?.scrollIntoView({ block: "end" });
}
```

- Do not call `setState` while someone is typing. Leave the value in the DOM and move it into
  state only when the entry is committed.
- Start timers and animation loops in `mounted()`, and **always stop them in `unmounted()`**.
- Crossing to another slide unmounts the old one and its state is gone. **Anything you want to
  show again later belongs in an `atom`**, not in a slide:

```tsx
import { atom } from "@suraido/atom"; // npm i @suraido/atom

const votes = atom([0, 0, 0]); // module scope, outside every slide

class Poll extends Slide {
  mounted() {
    this.watch(votes);
  } // redraw when it changes; dropped on the way out
  render() {
    /* votes.get() */
  }
}
```

Use `votes.update(fn)` or `votes.set(next)` to write. Do not subscribe by hand — `watch`
cleans up when the slide leaves, and a subscription left behind keeps the dead slide alive.

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

`→ ↓ Space` forward, `← ↑` back, `Home` `End`, `f` fullscreen. Clicking advances;
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
