/**
 * The parts of suraido.js that are easy to get wrong, carried by the CLI rather than left on a
 * website. It ships with the version you installed, so what it says is what your deck does.
 */

export type Doc = { description: string; body: string };

export const DOCS: Record<string, Doc> = {
  slides: {
    description: "What a slide is, and the three rules about putting one in a deck",
    body: `# Slides

A slide is a class. State lives on it, as usual.

    import { deck, Pad, Slide } from "suraido.js";

    class Intro extends Slide<{}, { count: number }> {
      static path = "intro";   // the URL becomes #intro; without it, the index is used
      state = { count: 0 };

      mounted() {}    // timers and video start here
      updated() {}    // right after a rebuild: put focus and scroll back
      unmounted() {}  // and always stop here what you started in mounted()

      render() {
        return <Pad><h2>Hello</h2></Pad>;
      }
    }

    deck([Intro]);

Three things go wrong quietly if you do not know them:

- **Put the classes themselves in the array.** Wrapping one — \`(p) => <Intro {...p} />\` —
  drops its statics, so reveals and URLs stop working. TypeScript rejects it.
- **\`render()\` returns a single element.** Return several and only the first is drawn.
- **\`setState\` rebuilds that slide's DOM.** Nothing is diffed, so a \`<video>\` restarts and a
  focused \`<input>\` loses focus. Put them back in \`updated()\`.

Crossing to another slide unmounts it and its state is gone. Anything you want to show again
belongs in \`@suraido/atom\`, at module scope, watched with \`this.watch(...)\`.
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

A browser opens the built deck, walks it the way you would, and takes what is on screen. So
what comes out is what the room would have seen; there is no second rendering path.

- One page per slide, fully revealed. \`--steps\` gives one per reveal instead.
- \`--scale 2\` for images meant to be looked at closely.
- Chrome is used if it is installed. If it is not, one is fetched once.

It also reports any slide whose content runs past the 1920x1080 canvas. Nothing on screen
shows that — the stage is scaled down, so the overflow is simply cut off — and it is the one
thing about a deck that cannot be known without drawing it.
`,
  },
};
