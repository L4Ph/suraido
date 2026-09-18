# suraido.js

**スライド (suraido)** — the Japanese for _slide_, spelled the way it is said.

Write slides in JSX. No React, no virtual DOM.

```
npm create suraido@latest my-deck
```

Zero dependencies; the build comes to 6.4 kB (2.9 kB gzipped).

## What is in here

| File                                     | Lines |                                                              |
| ---------------------------------------- | ----- | ------------------------------------------------------------ |
| [src/jsx-runtime.ts](src/jsx-runtime.ts) | 31    | JSX → `{type, props, key}`, plus the `JSX` types             |
| [src/dom.ts](src/dom.ts)                 | 166   | vnode → DOM, `Component`, `setState`, `flushSync`            |
| [src/nav.ts](src/nav.ts)                 | 26    | Moving between slides and steps, and the URL. Pure functions |
| [src/deck.tsx](src/deck.tsx)             | 134   | `Slide` / `Step` / `Deck` / `deck()`                         |
| [src/layout.tsx](src/layout.tsx)         | 57    | `Pad` / `Center` / `Cols` / `Full`                           |
| [src/themes/](src/themes)                | —     | Six keycap colorways                                         |

## Build tools

The integration point is a single line of `tsconfig.json`.

```json
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "suraido.js" } }
```

|                   | Extra configuration |
| ----------------- | ------------------- |
| Vite              | none                |
| Rsbuild           | none                |
| Rspack on its own | required (below)    |

Vite and Rsbuild both read `jsxImportSource` from `tsconfig.json`, so a project made by
`npm create suraido` builds under either one untouched. The entry is `src/index.tsx` to match
Rsbuild's default; Vite reads the script tag in `index.html`, so the name costs nothing there.

Only bare Rspack needs telling, because SWC does not look at `tsconfig.json`:

```js
{
  test: /\.tsx?$/,
  loader: "builtin:swc-loader",
  options: {
    jsc: {
      parser: { syntax: "typescript", tsx: true },
      transform: { react: { runtime: "automatic", importSource: "suraido.js" } },
    },
  },
}
```

Leave `importSource` out and SWC goes looking for `react/jsx-runtime`, failing with
`Can't resolve 'react/jsx-runtime'` — which does not look like a suraido.js problem at all.

## Writing a deck

One file. The slides and the `deck()` call that starts them live together.

```tsx
// src/index.tsx
import { Cols, deck, Pad, Slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/olivia.css";

class Intro extends Slide<{}, { count: number }> {
  static path = "intro"; // → #intro.1 (without it, the index is used)
  state = { count: 0 };

  mounted() {
    /* timers and video control go here */
  }
  updated() {
    /* right after a rebuild: restore focus and other DOM-side state */
  }
  unmounted() {}

  render() {
    return (
      <Pad>
        <h2>Heading</h2>
        <Cols ratio="2fr 1fr">
          <p>
            Body text. <strong>Emphasis</strong> takes the accent color.
          </p>
          <img src="/photo.jpg" />
        </Cols>
        <Step n={1}>
          <p>Appears on the second key press</p>
        </Step>
      </Pad>
    );
  }
}

deck([Intro]);
```

`deck()` looks for `#root` and creates a container on `body` if there is none.

### Built-in components

Only the arrangements you would otherwise rewrite on every deck. Each carries a `suraido.js-`
class inside an `@layer`, so plain CSS overrides it.

|                |                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<Pad>`        | The body of a slide: full height, `--suraido-pad` of padding                                                                                                                               |
| `<Center>`     | `<Pad>` with its contents centred vertically. For covers and section dividers                                                                                                              |
| `<Cols>`       | Columns — one per child. `ratio="2fr 1fr"` sets the proportions                                                                                                                            |
| `<Full>`       | Full bleed, ignoring the padding. A direct `img` / `video` child covers the slide                                                                                                          |
| `<Step n={1}>` | Transparent until the step is reached, but holds its space so nothing shifts. It marks the element you wrote rather than adding one, so `<Step n={1}><li>…</li></Step>` is still `ul > li` |

Everything else is plain HTML. `<img>`, `<video>`, `<table>` and `<svg>` work as they are, and
anything under `<svg>` gets the SVG namespace automatically. Headings, body text, lists, quotes
and `code` already carry slide-sized typography from the `suraido.type` layer, so `<h2>` is
simply the right size.

## Themes

One stylesheet. It only overrides `--suraido-*`; there is no JavaScript in it.

```ts
import "suraido.js/deck.css";
import "suraido.js/themes/olivia.css";
```

Taken from keycap colorways.

|             | Ground                            |       | For                               |
| ----------- | --------------------------------- | ----- | --------------------------------- |
| `olivia`    | cream and salmon                  | light | Elegant and safe. Start here      |
| `noel`      | pale aqua and blossom pink        | light | Soft, on the cute side            |
| `nine009`   | grey-beige and orange             | light | The color of an old calculator    |
| `botanical` | cream and deep green              | light | Calm; good for text-heavy talks   |
| `dolch`     | black, grey, white                | dark  | Monochrome. Survives any lighting |
| `laser`     | deep purple with magenta and cyan | dark  | When you want it loud             |

Every theme is **held to a contrast bar by tests** — body text at 7:1 or better, secondary text
at 4.5:1, headings and shapes at 3:1. A new theme has to clear the same bar, because a palette
that looks lovely on a laptop can be unreadable from the back of a room.

For your own theme, write the same tokens. Put them on `:root` and they beat suraido.js's layer.

## Where suraido.js stops and you start

Every suraido.js style lives inside an `@layer`. Layered styles always lose to unlayered ones, so a
plain selector wins without `!important` and without specificity games.

```css
/* yours — beats suraido.js's .pager even at lower specificity */
.pager {
  display: none;
}
```

Three tiers:

| Tier           | What                                                                                             |                                                |
| -------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| **Machinery**  | `.stage`'s `position` / `transform` / `transform-origin`, `--suraido-scale`, `.step[data-shown]` | Override it and scaling and reveals break      |
| **Tokens**     | `--suraido-*`                                                                                    | **The public API.** Themes change nothing else |
| **Appearance** | colors, `.pager`, transitions                                                                    | Yours                                          |

### Tokens

```css
:root {
  --suraido-fg: #16181d; /* text */
  --suraido-bg: #fbfaf8; /* the slide's ground */
  --suraido-accent: #2f6df6;
  --suraido-muted: #6b7280;
  --suraido-font: system-ui, sans-serif;
  --suraido-accent-2: var(--suraido-accent);
  --suraido-rule: …; /* rules and borders */
  --suraido-font-mono: …;

  --suraido-pad: 96px 120px; /* slide padding; using it is up to you */
  --suraido-gap: 72px; /* the gap between columns */
  --suraido-letterbox: #111; /* what shows around the slide */

  --suraido-h1: 92px; /* real sizes on the 1920x1080 canvas */
  --suraido-h2: 60px;
  --suraido-h3: 34px;
  --suraido-text: 32px;

  --suraido-step-fade: 200ms;
  --suraido-slide-fade: 180ms;
}
```

### Keeping styles next to the slide

You do not need a separate file or CSS Modules: write `<style>` inside the slide.
**Only one slide is mounted at a time**, so what you write applies while that slide is up and
leaves with it.

```tsx
class Stats extends Slide {
  render() {
    return (
      <Pad>
        <div class="stats">…</div>
        <style>{`
          .stats { display: flex; gap: 80px; }
          .stats b { font-size: 96px; color: var(--suraido-accent); }
        `}</style>
      </Pad>
    );
  }
}
```

Three ways to keep styles close, and they are not equivalent:

|                        | Pseudo-classes and elements | Media queries | Descendant selectors | Keyframes |
| ---------------------- | --------------------------- | ------------- | -------------------- | --------- |
| `style={{ }}`          | ✗                           | ✗             | ✗                    | ✗         |
| `<style>` in the slide | ✓                           | ✓             | ✓                    | ✓         |
| A separate `.css` file | ✓                           | ✓             | ✓                    | ✓         |

`style={{ }}` is for injecting one value, such as the `width: ${pct}%` above. For anything
else, `<style>` covers it without a separate file.

## Presenter view

A second window with your notes, what is coming and a clock, while the deck stays on the
projector. It is [its own package](../presenter) — not everyone presents from a machine with
two screens, and nothing of it reaches your bundle unless you install it.

```sh
npm i @suraido/presenter
```

```tsx
import { deck, Slide } from "suraido.js";
import { presenter } from "@suraido/presenter";

class Intro extends Slide {
  static notes = "Thank the organisers. Mention the wifi password.";
}

deck([Intro], { use: [presenter()] }); // press p to open it
```

Arrow keys work in either window and both stay together; `r` restarts the clock. The two talk
over a `BroadcastChannel`, which reaches **same-origin windows in the same browser** — a
laptop and a projector, not the audience's phones.

## Attaching things

Whatever is in `use` is handed the deck, and can read it, move it and hear about it moving.
That object is the whole contract — there is nothing else to learn.

```ts
type Plugin = (deck: DeckContext) => (() => void) | void;

type DeckContext = {
  readonly at: At;                    // index, step, steps, total, path
  readonly slides: readonly SlideInfo[];   // path, notes
  go(to: string | { index: number; step?: number }): void;
  move(by: 1 | -1): void;
  on("move", run: (at: At) => void): () => void;   // returns the way to stop
};
```

Returning a function undoes whatever the plugin set up; the deck calls it on the way out, in
reverse order. `deck()` also returns the context, for a test or for reaching in from elsewhere.

## Slide transitions

Crossing to another slide slides: forward pushes the old one out to the left and brings the
new one in from the right, and back reverses it. The deck moves the way the keys do.

```css
:root {
  --suraido-slide-fade: 260ms;
  --suraido-slide-ease: cubic-bezier(0.32, 0.72, 0, 1);
}
```

- **Stepping does not transition.** The opacity transition on `.step` handles that.
- `prefers-reduced-motion: reduce` turns off the slide and the step fade alike.
- Where `document.startViewTransition` is missing, slides simply cut. There is a feature check.

For a plain cross-fade instead, take the animation back off — your stylesheet beats the layer:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-name: none;
}
```

`::view-transition-group(root)` gets the same duration. Leave it out and the group keeps the
UA's 250ms, which holds the transition open longer than the slide it is carrying.

## Paths that never re-render

Reveals and scaling deliberately avoid `render()`:

- **Stepping** toggles `data-shown` on `.step`. The CSS transition survives
- **Resizing** rewrites `--suraido-scale` on `:root`. The slide's DOM is untouched

`render()` runs when you cross to another slide, and when a slide calls its own `setState`.

## Controls

`→ ↓ Space` forward, `← ↑` back, `Home` `End`, `f` fullscreen.

Tapping the left quarter of the screen goes back and anywhere else goes forward, so a deck
works on a phone, where there is no shift key. Shift-clicking goes back too.

A click on `a`, `button`, `input`, `select`, `textarea` or `label` does not turn the page —
controls inside a slide just work. Mark anything else clickable with `data-suraido-keep`.

The position lives in the URL as `#intro.1`, so a reload lands in the same place. suraido.js uses
`replaceState`, so no history is stacked — the browser's back button leaves the deck rather
than fighting the arrow keys.

## The life of state

- `setState` **rebuilds that slide's DOM**; nothing is diffed
- Crossing to another slide unmounts it and the state is gone

### Something that outlives a slide

Anything you want to show again later cannot live in a slide's own state. Put it in an `atom`
at module scope, and `watch` it from whichever slides care. `watch` is in the core; the store
is [a package of its own](../atom), so a deck that never shares state never carries it:

```sh
npm i @suraido/atom
```

```tsx
import { atom } from "@suraido/atom";

const votes = atom([0, 0, 0]);

class Poll extends Slide {
  mounted() {
    this.watch(votes);
  }
  cast(i: number) {
    votes.update((counts) => counts.map((n, j) => (j === i ? n + 1 : n)));
  }
  render() {
    /* votes.get() */
  }
}

class Results extends Slide {
  // several slides later
  mounted() {
    this.watch(votes);
  } // same atom, nothing passed along
  render() {
    /* votes.get() */
  }
}
```

`watch` redraws the component whenever the atom changes, and drops the subscription when the
component leaves — so a slide you have moved on from stops being redrawn, and the atom stops
holding on to it. Writing a value equal to the current one notifies nobody.

`watch` asks for nothing but `subscribe(fn)` returning an unsubscribe, so any store shaped
that way — a signal library, something you wrote this morning — works in an atom's place.

See [examples/interactive](../../examples/interactive), where a vote taken on the first slide
is read back several slides later.

## What has been traded away

- **`setState` does not preserve DOM identity.** A `<video>`, a focused `<input>` or a
  transition in flight will break on a slide that calls it. Focus and scroll can be put back in
  `updated()` (see [examples/interactive](../../examples/interactive)). To avoid the whole
  problem, bring diffing back: `flush()` in [dom.ts](src/dom.ts) becomes a patch, roughly 50 lines
- **Reveals go through `<Step>` only.** You cannot branch on the step inside `render()`
- **A component's root is a single element.** Return several and only the first is drawn
- **`<Step>` marks one element, or builds a `div`.** Give it a single element and that element
  carries the reveal; give it bare text or several children and it makes a `div` to carry it
- **Put the classes themselves in `slides`.** `(p) => <Demo {...p} />` drops the statics, so
  reveals and URLs stop working — TypeScript rejects it
- **There is no `ref`.** Add one (about five lines) when you need a handle on a `<video>` or
  `<canvas>`
