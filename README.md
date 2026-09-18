# suraido.js

[![npm](https://img.shields.io/npm/v/suraido.js)](https://www.npmjs.com/package/suraido.js) [![tour](https://img.shields.io/badge/tour-live-blue)](https://l4ph.github.io/suraido/)

**スライド (suraido)** — the Japanese for _slide_, spelled the way it is said.

A framework for writing slides in JSX. No React, no virtual DOM: JSX goes through suraido.js's own
runtime and becomes DOM directly.

Integration is one line of `tsconfig.json`, so it works as-is under Vite and Rsbuild.

```
npm create suraido@latest my-deck
npm create suraido@latest ./decks/2026-04 --name react-conf-talk --theme laser
```

## Packages

|                                           |                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| [suraido.js](packages/suraido)            | The framework. JSX runtime, `Slide` / `Step` / `Deck`, layout components, themes |
| [create-suraido](packages/create-suraido) | `npm create suraido`                                                             |
| [@suraido/atom](packages/atom)            | State that outlives a slide. Opt in                                              |
| [@suraido/cli](packages/cli)              | `suraido export` — a deck as a PDF, or as images                                 |

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
