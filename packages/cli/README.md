# @suraido/cli

Tools for a deck built with [suraido.js](../suraido).

```sh
npx @suraido/cli export dist --pdf
```

```
suraido: 15 pages → deck.pdf
```

## export

A browser opens the built deck, walks it the way you would, and takes what is on screen at each
stop. **What comes out is what the room would have seen** — there is no second rendering path
to disagree with the first, and nothing special has to be added to the deck for it.

The text stays text: a slide of code comes out selectable and searchable, not as a picture of
code.

|                      |                        |                                                        |
| -------------------- | ---------------------- | ------------------------------------------------------ |
| `--pdf`              | default                | One page per slide, fully revealed                     |
| `--png`              |                        | One image per slide                                    |
| `--out <path>`       | `deck.pdf` / `slides/` | A file for `--pdf`, a directory for `--png`            |
| `--steps`            |                        | A page per reveal instead of per slide — for a handout |
| `--scale <n>`        | `1`                    | Pixels per point, for `--png`                          |
| `--browser-path <p>` |                        | A browser to render with, instead of looking for one   |
| `--json`             |                        | The result as one line of JSON                         |

Chrome is used if it is installed — any channel. If none is, one is fetched into
`~/.cache/suraido` the first time and reused after that.

### It also tells you what does not fit

```
suraido: 4 pages → deck.pdf
  #toomuch runs 2036px past the bottom of the canvas, and that part is cut off
```

A slide whose content runs past the 1920x1080 canvas is clipped, and **nothing on screen shows
it**, because the whole stage is scaled down to fit the window. It is the one thing about a
deck that cannot be known without drawing it, which is why it is said here rather than by the
deck itself: nothing you ship to an audience should be spending its time checking itself.

## docs

```sh
npx @suraido/cli docs           # what there is
npx @suraido/cli docs reveals   # one of them in full
```

The parts that are easy to get wrong, carried by the CLI rather than left on a website — so
what they say is what the version you installed actually does. `--json` for whoever is reading
them by machine.

## Licence

MIT
