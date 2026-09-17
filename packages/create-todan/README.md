# create-todan

```
npm create todan@latest my-deck
```

Creates a slide project built on [todan](../todan). Two things come with it.

**`AGENTS.md`** — tells a coding agent how todan works: use `class`, do not wrap the classes
passed to `deck()`, `setState` rebuilds the DOM, styles are overridden from outside the
`@layer`, and so on.

**`.agents/skills/rehearse/`** — a rehearsal skill. It opens every slide and measures it, to
find content **clipped by the fixed 1920x1080 canvas** (invisible, because the stage is
`overflow: hidden` and scaled down), contrast too low to read, and images that never loaded.
