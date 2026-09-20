# suraido.js

[![npm](https://img.shields.io/npm/v/suraido.js)](https://www.npmjs.com/package/suraido.js) [![tour](https://img.shields.io/badge/tour-live-blue)](https://l4ph.github.io/suraido/)

**スライド (suraido)** — the Japanese for _slide_, spelled the way it is said.

A framework for writing slides in JSX. No React and no dependencies: JSX goes through
suraido.js's own runtime and becomes DOM directly.

Integration is one line of `tsconfig.json`, so it works as-is under Vite and Rsbuild.

```
npm create suraido@latest my-deck
npm create suraido@latest ./decks/2026-04 --name react-conf-talk --theme laser
```

## Starting a deck with a coding agent

Paste this into your agent, from the directory the deck should live in:

```md
Build a slide deck here with suraido.js (https://github.com/L4Ph/suraido): slides written in
JSX and rendered straight to the DOM. It is not React — no React, no dependencies, its own
JSX runtime. Read its AGENTS.md before writing any JSX; it beats habits from other frameworks.

Scaffold, in an empty directory:

`npm create suraido@latest . --name <name> --theme <theme>`

`--theme` is one of `olivia` `noel` `nine009` `botanical` `dolch` `laser`. The AGENTS.md this
writes is the rules for the project. `npx @suraido/cli docs` lists more, and
`npx @suraido/cli docs reveals` is worth reading before the first `<Step>`.

Then:

- `npm install`
- `npm run dev` — the dev server. `→`/`←` move, `f` fullscreen, `o` shows every slide at once
- `npm run build`, then `npx @suraido/cli export dist --pdf` for the file you hand over

Two things the source cannot show you:

- Slides are drawn on a fixed 1920x1080 canvas, scaled to the window. Content that runs past
  it is clipped and **nothing on screen shows that it happened**. `export` reports it — treat
  what it reports as a failure, not a warning.
- suraido.js styles live in an `@layer`, so a plain selector of yours wins. Reach for the
  `--suraido-*` variables before writing a selector.

Before saying you are done, run the `rehearse` skill in `.agents/skills/rehearse/` — it opens
every slide and measures it — and fix what it finds. Then report what you changed and
anything you still cannot make fit.
```

That prompt, and the `AGENTS.md` it points at, say the same things the rest of this README
does — the deck that comes out is one you can read.

## Packages

|                                           |                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| [suraido.js](packages/suraido)            | The framework. JSX runtime, `slide()` / `Step` / `deck()`, layout, themes |
| [create-suraido](packages/create-suraido) | `npm create suraido`                                                      |
| [@suraido/cli](packages/cli)              | `suraido export` — a deck as a PDF, or as images                          |

## Examples

|                                     |                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| [basic](examples/basic)             | The smallest deck: a cover, staged reveals, state on a class                           |
| [layouts](examples/layouts)         | Cover, section divider, two columns, full bleed, quote, figures. **Made to be copied** |
| [themes](examples/themes)           | The same deck under six themes                                                         |
| [interactive](examples/interactive) | A live tally, an animation, a text field. The things a Markdown deck cannot do         |

## Development

This repository uses [Vite+](https://viteplus.dev).

```
vp install
vp check          # format, lint, type check
vp test           # 24 tests
vp pack           # build the library (run inside packages/suraido)
vp dev            # run an example (run inside examples/<name>)
```

The template under `packages/create-suraido/template` is also a workspace: inside the repository
it is a deck you can run, and `create-suraido` hands out a copy of it. One copy, no drift.
