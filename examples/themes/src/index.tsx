import { Cols, deck, Pad, slide, Step } from "suraido.js";
import "suraido.js/deck.css";
// A theme is one stylesheet. All it does is override --suraido-*.
import "suraido.js/themes/noel.css";
import "./slides.css";

/** The same content under every theme. Not one color is written on the slide. */
const Sampler = slide({ path: "sampler" }, () => (
  <Pad>
    <h1>スライド</h1>
    <p>
      No color is written on this slide. Swapping the one <code>suraido.js/themes/*.css</code>{" "}
      import changes all of it, and <strong>emphasis takes the accent</strong>.
    </p>
    <hr />
    <Cols>
      <ul>
        <Step n={1}>
          <li>Staged reveals</li>
        </Step>
        <Step n={2}>
          <li>List markers take the accent too</li>
        </Step>
      </ul>
      <blockquote>
        The best code is the code that was never written.
        <cite>— the thing everyone says</cite>
      </blockquote>
    </Cols>
  </Pad>
));

const Numbers = slide({ path: "numbers" }, () => (
  <Pad>
    <h2>Figures</h2>
    <div class="stats">
      <div>
        <b>166</b>
        <span>lines in dom.ts</span>
      </div>
      <div>
        <b>6.4 kB</b>
        <span>built</span>
      </div>
      <div>
        <b>0</b>
        <span>dependencies</span>
      </div>
    </div>
    <style>{`
          .stats { display: flex; gap: 72px; margin-top: 48px; }
          .stats b {
            display: block; font-size: 88px; line-height: 1;
            letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
            color: var(--suraido-accent);
          }
          .stats span { font-size: 26px; color: var(--suraido-muted); }
        `}</style>
  </Pad>
));

deck([Sampler, Numbers]);
