/**
 * The parts of suraido.js that are easy to get wrong, carried by the CLI rather than left on a
 * website. It ships with the version you installed, so what it says is what your deck does.
 */

export type Doc = { description: string; body: string };

export const DOCS: Record<string, Doc> = {
  slides: {
    description: "What a slide is, and the three rules about putting one in a deck",
    body: `# Slides

A slide is a function. It runs once, when the slide arrives, and returns what to draw.

    import { deck, Pad, slide } from "suraido.js";

    const Intro = slide({ path: "intro" }, () => (
      <Pad><h2>Hello</h2></Pad>
    ));

    deck([Intro]);

The meta can be left out when there is nothing to say about the slide itself:
\`slide(() => <Pad>…</Pad>)\`.

Return a function instead and it becomes the view, run again every time the slide is redrawn.
Because the setup ran once, a plain \`let\` in it is state with the life of the slide — it
starts again when you come back. Nothing is watching that variable, so say \`update()\`.

    const Counter = slide({ path: "count" }, ({ update }) => {
      let n = 0;
      return () => <button onClick={() => { n++; update() }}>Pressed {n} times</button>;
    });

A slide is handed three things, and most need none of them:

- \`update()\` — draw again
- \`signal\` — an AbortSignal, aborted when the slide leaves. Give it to addEventListener and
  there is no cleanup to write: \`addEventListener("resize", fn, { signal })\`
- \`after(fn)\` — run once the next draw is on screen, for measuring or focusing

Two things go wrong quietly if you do not know them:

- **\`render()\` returns a single element.** Return several and only the first is drawn.
- **A redraw does not restart anything.** The elements are kept, so a \`<video>\` keeps playing
  and a field keeps what was typed in it. Nothing has to be put back.

State that outlives a slide is a variable at module scope. Nothing needs telling: two slides
are never on screen at once, so the later one reads it when it is drawn.
`,
  },

  reveals: {
    description: "<Step>: revealing things one at a time, and taking them away again",
    body: `# Reveals

    <ul>
      <Step><li>appears first</li></Step>
      <Step><li>then this</li></Step>
    </ul>

- **Do not number them.** A bare \`<Step>\` takes the one after the last, so inserting one does
  not renumber the rest.
- \`<Step n={3}>\` when you mean a particular place. Naming a number carries the counting
  forward from there.
- \`<Step n={[2, 4]}>\` comes in at 2 and is gone by 4 — **the second number is exclusive**. The
  next unnumbered reveal lands on the step it leaves, so one press swaps this for that.
- **It marks the element you wrote**, it does not add one: inside a list write the \`<li>\`
  yourself and you still get \`ul > li\`. With bare text it makes a \`div\` to hold the mark.
- **Do not declare how many stops a slide has.** It is counted from the reveals it draws.
  \`static steps\` overrides that, which is rarely what you want.

Stepping does not re-render the slide — it toggles one attribute, so a transition in flight
keeps running. You cannot branch on the step inside \`render()\`.
`,
  },

  export: {
    description: "Turning a built deck into a PDF or images",
    body: `# Export

Build the deck the way you build any app — \`vite build\` — then:

    npx @suraido/cli export dist --pdf
    npx @suraido/cli export dist --png --out slides/
    npx @suraido/cli export dist --pptx

A browser opens the built deck, walks it the way you would, and takes what is on screen. So
what comes out is what the room would have seen; there is no second rendering path.

- One page per slide, fully revealed. \`--steps\` gives one per reveal instead.
- \`--pptx\` is for an upload form that only takes PowerPoint: every slide goes in as a
  full-bleed picture, so it opens anywhere and the text is no longer text.
- \`--scale 2\` for images meant to be looked at closely.
- Chrome is used if it is installed. If it is not, one is fetched once.

It also reports any slide whose content runs past the 1920x1080 canvas. Nothing on screen
shows that — the stage is scaled down, so the overflow is simply cut off — and it is the one
thing about a deck that cannot be known without drawing it.
`,
  },
};
