# create-todan

```
npm create todan@latest my-deck
npm create todan@latest ./decks/2026-04 --name react-conf-talk --theme laser
```

Creates a slide project built on [todan](../todan). Pass what you have already decided; you
are asked for the rest. There are only ever two questions, and where there is no terminal to
ask on — piped, or in CI — the defaults are taken instead of hanging.

|             |                                                                                 |
| ----------- | ------------------------------------------------------------------------------- |
| `directory` | where to put it (default: `my-deck`)                                            |
| `--name`    | the package name (default: taken from the directory, lowercased and hyphenated) |
| `--theme`   | `olivia` `noel` `nine009` `botanical` `dolch` `laser` (default: `olivia`)       |

Two things come with the project.

**`AGENTS.md`** — tells a coding agent how todan works: use `class`, do not wrap the classes
passed to `deck()`, `setState` rebuilds the DOM, styles are overridden from outside the
`@layer`, and so on.

**`.agents/skills/rehearse/`** — a rehearsal skill. It opens every slide and measures it, to
find content **clipped by the fixed 1920x1080 canvas** (invisible, because the stage is
`overflow: hidden` and scaled down), contrast too low to read, and images that never loaded.
