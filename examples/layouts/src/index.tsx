import { Center, Cols, deck, Full, Pad, slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/nine009.css";
import "./slides.css";

/**
 * A deck is a list of slides, so they can be written straight into it. Naming them first —
 * the way the other examples do — gives the deck() call a table of contents and lets one move
 * to a file of its own. For a short catalogue, the list is already the table of contents.
 */
deck([
  slide({ path: "title" }, () => (
    <Center>
      <p class="eyebrow">suraido.js — スライド</p>
      <h1>Shapes you keep needing</h1>
      <p class="lead">You will rebuild these every time, so copy them from here</p>
    </Center>
  )),
  slide({ path: "section" }, () => (
    <Center class="invert">
      <p class="num">01</p>
      <h2>A section divider</h2>
    </Center>
  )),
  slide({ path: "cols" }, () => (
    <Pad>
      <h2>Two columns</h2>
      <Cols>
        <div>
          <h3>Left</h3>
          <p>The explanation goes here — the part you want read.</p>
        </div>
        <Step n={1}>
          <div>
            <h3>Right</h3>
            <p>A diagram or some code, held back until you press the key.</p>
          </div>
        </Step>
      </Cols>
    </Pad>
  )),
  slide({ path: "ratio" }, () => (
    <Pad>
      <h2>Changing the proportions</h2>
      <Cols ratio="2fr 1fr">
        <p>
          Give the body most of the width and set a narrow aside beside it. Whatever you pass goes
          straight to grid-template-columns.
        </p>
        <aside>
          <h3>Aside</h3>
          <p>The narrow one.</p>
        </aside>
      </Cols>
    </Pad>
  )),
  slide({ path: "full" }, () => (
    <Full>
      <img src="/photo.svg" alt="" />
      <div class="caption">
        <h2>Full bleed</h2>
        <p>Ignore the padding and run to the edges. Text sits on top.</p>
      </div>
    </Full>
  )),
  slide({ path: "quote" }, () => (
    <Center>
      <blockquote>
        The best code is the code that was never written.
        <cite>— the thing everyone says</cite>
      </blockquote>
    </Center>
  )),
  // Styles kept inside the slide. Only one is on screen, so nothing collides.
  slide({ path: "stats" }, () => (
    <Pad>
      <h2>Figures side by side</h2>
      <Cols>
        <Step n={1}>
          <div>
            <b>166</b>
            <span>lines in dom.ts</span>
          </div>
        </Step>
        <Step n={2}>
          <div>
            <b>6.4 kB</b>
            <span>built</span>
          </div>
        </Step>
        <Step n={3}>
          <div>
            <b>0</b>
            <span>dependencies</span>
          </div>
        </Step>
      </Cols>

      <style>{`
            .suraido-cols b {
              display: block;
              font-size: 88px;
              line-height: 1;
              letter-spacing: -0.03em;
              font-variant-numeric: tabular-nums;
              color: var(--suraido-accent);
            }
            .suraido-cols span { font-size: 26px; color: var(--suraido-muted); }
          `}</style>
    </Pad>
  )),
]);
