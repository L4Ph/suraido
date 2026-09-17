import { Center, Cols, deck, Full, Pad, Slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/nine009.css";
import "./slides.css";

class Title extends Slide {
  static path = "title";
  render() {
    return (
      <Center>
        <p class="eyebrow">suraido.js — スライド</p>
        <h1>Shapes you keep needing</h1>
        <p class="lead">You will rebuild these every time, so copy them from here</p>
      </Center>
    );
  }
}

class Section extends Slide {
  static path = "section";
  render() {
    return (
      <Center class="invert">
        <p class="num">01</p>
        <h2>A section divider</h2>
      </Center>
    );
  }
}

class TwoCols extends Slide {
  static path = "cols";
  static steps = 2;
  render() {
    return (
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
    );
  }
}

class Ratio extends Slide {
  static path = "ratio";
  render() {
    return (
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
    );
  }
}

class FullBleed extends Slide {
  static path = "full";
  render() {
    return (
      <Full>
        <img src="/photo.svg" alt="" />
        <div class="caption">
          <h2>Full bleed</h2>
          <p>Ignore the padding and run to the edges. Text sits on top.</p>
        </div>
      </Full>
    );
  }
}

class Quote extends Slide {
  static path = "quote";
  render() {
    return (
      <Center>
        <blockquote>
          The best code is the code that was never written.
          <cite>— the thing everyone says</cite>
        </blockquote>
      </Center>
    );
  }
}

/** Styles kept inside the slide. Only one slide is mounted, so nothing collides. */
class Stats extends Slide {
  static path = "stats";
  static steps = 4;
  render() {
    return (
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
    );
  }
}

deck([Title, Section, TwoCols, Ratio, FullBleed, Quote, Stats]);
