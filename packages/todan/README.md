# todan

**登壇 (tōdan)** — to step onto the platform, to give a talk.

Write slides in JSX. No React, no virtual DOM.

```
npm create todan@latest my-deck
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
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "todan" } }
```

|                   | Extra configuration |
| ----------------- | ------------------- |
| Vite              | none                |
| Rsbuild           | none                |
| Rspack on its own | required (below)    |

Vite and Rsbuild both read `jsxImportSource` from `tsconfig.json`, so a project made by
`npm create todan` builds under either one untouched. The entry is `src/index.tsx` to match
Rsbuild's default; Vite reads the script tag in `index.html`, so the name costs nothing there.

Only bare Rspack needs telling, because SWC does not look at `tsconfig.json`:

```js
{
  test: /\.tsx?$/,
  loader: "builtin:swc-loader",
  options: {
    jsc: {
      parser: { syntax: "typescript", tsx: true },
      transform: { react: { runtime: "automatic", importSource: "todan" } },
    },
  },
}
```

Leave `importSource` out and SWC goes looking for `react/jsx-runtime`, failing with
`Can't resolve 'react/jsx-runtime'` — which does not look like a todan problem at all.

## Writing a deck

One file. The slides and the `deck()` call that starts them live together.

```tsx
// src/index.tsx
import { Cols, deck, Pad, Slide, Step } from "todan";
import "todan/deck.css";
import "todan/themes/olivia.css";

class Intro extends Slide<{}, { count: number }> {
  static path = "intro"; // → #intro.1 (without it, the index is used)
  static steps = 2; // how many key presses this slide absorbs
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

Only the arrangements you would otherwise rewrite on every deck. Each carries a `todan-`
class inside an `@layer`, so plain CSS overrides it.

|                |                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `<Pad>`        | The body of a slide: full height, `--todan-pad` of padding                                                                           |
| `<Center>`     | `<Pad>` with its contents centred vertically. For covers and section dividers                                                        |
| `<Cols>`       | Columns — one per child. `ratio="2fr 1fr"` sets the proportions                                                                      |
| `<Full>`       | Full bleed, ignoring the padding. A direct `img` / `video` child covers the slide                                                    |
| `<Step n={1}>` | Transparent until the step is reached, but holds its space so nothing shifts. Inside `<ul>`, add `as="li"` so no `div` comes between |

Everything else is plain HTML. `<img>`, `<video>`, `<table>` and `<svg>` work as they are, and
anything under `<svg>` gets the SVG namespace automatically. Headings, body text, lists, quotes
and `code` already carry slide-sized typography from the `todan.type` layer, so `<h2>` is
simply the right size.

## Themes

One stylesheet. It only overrides `--todan-*`; there is no JavaScript in it.

```ts
import "todan/deck.css";
import "todan/themes/olivia.css";
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

For your own theme, write the same tokens. Put them on `:root` and they beat todan's layer.

## Where todan stops and you start

Every todan style lives inside an `@layer`. Layered styles always lose to unlayered ones, so a
plain selector wins without `!important` and without specificity games.

```css
/* yours — beats todan's .pager even at lower specificity */
.pager {
  display: none;
}
```

Three tiers:

| Tier           | What                                                                                           |                                                |
| -------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Machinery**  | `.stage`'s `position` / `transform` / `transform-origin`, `--todan-scale`, `.step[data-shown]` | Override it and scaling and reveals break      |
| **Tokens**     | `--todan-*`                                                                                    | **The public API.** Themes change nothing else |
| **Appearance** | colors, `.pager`, transitions                                                                  | Yours                                          |

### Tokens

```css
:root {
  --todan-fg: #16181d; /* text */
  --todan-bg: #fbfaf8; /* the slide's ground */
  --todan-accent: #2f6df6;
  --todan-muted: #6b7280;
  --todan-font: system-ui, sans-serif;
  --todan-accent-2: var(--todan-accent);
  --todan-rule: …; /* rules and borders */
  --todan-font-mono: …;

  --todan-pad: 96px 120px; /* slide padding; using it is up to you */
  --todan-gap: 72px; /* the gap between columns */
  --todan-letterbox: #111; /* what shows around the slide */

  --todan-h1: 92px; /* real sizes on the 1920x1080 canvas */
  --todan-h2: 60px;
  --todan-h3: 34px;
  --todan-text: 32px;

  --todan-step-fade: 200ms;
  --todan-slide-fade: 180ms;
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
          .stats b { font-size: 96px; color: var(--todan-accent); }
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

## Slide transitions

Crossing to another slide cross-fades through View Transitions. The speed is a variable:

```css
:root {
  --slide-fade: 180ms;
} /* --todan-slide-fade, default 180ms */
```

- **Stepping does not transition.** The opacity transition on `.step` handles that.
- `prefers-reduced-motion: reduce` turns off both the transition and the step fade.
- Where `document.startViewTransition` is missing, slides simply cut. There is a feature check.

`::view-transition-group(root)` gets the same duration. Leave it out and the group keeps the
UA's 250ms, which holds the transition open about 70ms longer and makes fast stepping feel
sluggish.

## When something is wrong

A few todan mistakes produce no error, and the deck simply does the wrong thing quietly. Those
are reported to the console as they happen, with the position, the measurement and the fix:

- A slide that runs past the 1920x1080 canvas, and by how much. The overflow is clipped and
  the stage is scaled down, so nothing on screen shows that it happened
- A `<Step>` that wrapped an `li` in a `div`, which stops `ul > li` matching
- A `static steps` that does not match the highest `<Step n>` on the slide — either dead key
  presses or reveals that never arrive
- Something in `deck()` that is not a Slide subclass, which means its statics were dropped

## Paths that never re-render

Reveals and scaling deliberately avoid `render()`:

- **Stepping** toggles `data-shown` on `.step`. The CSS transition survives
- **Resizing** rewrites `--todan-scale` on `:root`. The slide's DOM is untouched

`render()` runs when you cross to another slide, and when a slide calls its own `setState`.

## Controls

`→ ↓ Space` forward, `← ↑` back, `Home` `End`, `f` fullscreen. Clicking advances;
shift-clicking goes back.

The position lives in the URL as `#intro.1`, so a reload lands in the same place. todan uses
`replaceState`, so no history is stacked — the browser's back button leaves the deck rather
than fighting the arrow keys.

## The life of state

- `setState` **rebuilds that slide's DOM**; nothing is diffed
- Crossing to another slide unmounts it and the state is gone
- There is **no mechanism for sharing state between slides**. When you need one, put a store
  outside — nanostores, or a hand-rolled atom — and `subscribe` to it in `mounted()`

## What has been traded away

- **`setState` does not preserve DOM identity.** A `<video>`, a focused `<input>` or a
  transition in flight will break on a slide that calls it. Focus and scroll can be put back in
  `updated()` (see [examples/interactive](../../examples/interactive)). To avoid the whole
  problem, bring diffing back: `flush()` in [dom.ts](src/dom.ts) becomes a patch, roughly 50 lines
- **Reveals go through `<Step>` only.** You cannot branch on the step inside `render()`
- **A component's root is a single element.** Return several and only the first is drawn
- **`<Step>` builds a `div` by default.** Inside `<ul>` or `<ol>`, pass `as="li"`, or you get
  `ul > div > li` and `ul > li` stops matching
- **`<Step>` reads the current step from a module-level variable.** Two decks on one screen
  would need that moved
- **Put the classes themselves in `slides`.** `(p) => <Demo {...p} />` drops `static steps`
  and `path`
- **There is no `ref`.** Add one (about five lines) when you need a handle on a `<video>` or
  `<canvas>`
