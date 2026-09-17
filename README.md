# todan

**登壇 (tōdan)** — to step onto the platform, to give a talk.

A framework for writing slides in JSX. No React, no virtual DOM: JSX goes through todan's own
runtime and becomes DOM directly.

Integration is one line of `tsconfig.json`, so it works as-is under Vite and Rsbuild.

```
npm create todan@latest my-deck
```

## Packages

|                                       |                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| [todan](packages/todan)               | The framework. JSX runtime, `Slide` / `Step` / `Deck`, layout components, themes |
| [create-todan](packages/create-todan) | `npm create todan`                                                               |

## Examples

|                                     |                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| [basic](examples/basic)             | The smallest deck: a cover, staged reveals, state on a class                           |
| [layouts](examples/layouts)         | Cover, section divider, two columns, full bleed, quote, figures. **Made to be copied** |
| [themes](examples/themes)           | The same deck under six themes                                                         |
| [interactive](examples/interactive) | A live tally, an rAF animation, a text field. The things a Markdown deck cannot do     |

## Development

This repository uses [Vite+](https://viteplus.dev).

```
vp install
vp check          # format, lint, type check
vp test           # 24 tests
vp pack           # build the library (run inside packages/todan)
vp dev            # run an example (run inside examples/<name>)
```

The template under `packages/create-todan/template` is also a workspace: inside the repository
it is a deck you can run, and `create-todan` hands out a copy of it. One copy, no drift.
