import { atom } from "@suraido/atom";
import { presenter } from "@suraido/presenter";
import { Center, Cols, deck, Full, Pad, Slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/noel.css";
import { Code } from "./code.tsx";
import "./slides.css";
import { applyTheme, THEMES } from "./themes.ts";

// ---------------------------------------------------------------- 1. cover

class Cover extends Slide {
  static path = "intro";
  static notes =
    "Thank the organisers. Say the whole deck is running, not pictured — then press p.";
  render() {
    return (
      <Center>
        <p class="eyebrow">スライド</p>
        <h1>suraido.js</h1>
        <p class="lead">
          Slides written in JSX. No React, no virtual DOM, no dependencies — and this deck is one of
          them.
        </p>
        <p class="hint">Press → to move. Everything here is running, not pictured.</p>
      </Center>
    );
  }
}

// ---------------------------------------------------------------- 2. shape

class Shape extends Slide {
  static path = "shape";
  static notes = "Four presses here. Land on: state on the class, class not className, plain HTML.";
  static steps = 4;
  render() {
    return (
      <Pad>
        <h2>A slide is a class</h2>
        <Cols ratio="1.1fr 1fr">
          <Code>{`class Intro extends Slide {
  static path = "intro";
  static steps = 2;

  render() {
    return (
      <Pad>
        <h2>Heading</h2>
        <Step n={1}>
          <p>Later</p>
        </Step>
      </Pad>
    );
  }
}

deck([Intro]);`}</Code>
          <ul>
            <Step n={1}>
              <li>State lives on the class, as state always has</li>
            </Step>
            <Step n={2}>
              <li>
                <code>class</code>, not <code>className</code> — props go straight to the DOM
              </li>
            </Step>
            <Step n={3}>
              <li>
                Everything else is plain HTML: <code>img</code>, <code>video</code>,{" "}
                <code>svg</code>
              </li>
            </Step>
          </ul>
        </Cols>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 3. steps

class Steps extends Slide {
  static path = "steps";
  static notes = "The point: nothing moves as these appear. They were always in the DOM.";
  static steps = 5;
  render() {
    return (
      <Pad>
        <h2>Reveals hold their place</h2>
        <p>
          The four lines below are all in the DOM already. They are transparent until you reach
          them, so <strong>nothing shifts</strong> as they appear.
        </p>
        <ul class="wide">
          <Step n={1}>
            <li>Pressing → does not re-render the slide</li>
          </Step>
          <Step n={2}>
            <li>It toggles one attribute, and CSS does the fade</li>
          </Step>
          <Step n={3}>
            <li>
              So a <code>video</code> keeps playing and a transition keeps running
            </li>
          </Step>
          <Step n={4}>
            <li>
              <code>static steps</code> says how many presses this slide absorbs
            </li>
          </Step>
        </ul>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 4. layout

class Layout extends Slide {
  static path = "layout";
  static steps = 2;
  render() {
    return (
      <Pad>
        <h2>The arrangements you keep rewriting</h2>
        <Cols>
          <div class="card">
            <b>&lt;Pad&gt;</b>
            <span>full height, with the padding token</span>
          </div>
          <div class="card">
            <b>&lt;Center&gt;</b>
            <span>the same, centred — covers and dividers</span>
          </div>
          <Step n={1}>
            <div class="card">
              <b>&lt;Cols&gt;</b>
              <span>one column per child; ratio="2fr 1fr" to weight them</span>
            </div>
          </Step>
        </Cols>
        <p class="hint">
          This row is a <code>&lt;Cols&gt;</code>. The third card arrived as a{" "}
          <code>&lt;Step&gt;</code> and the columns did not move.
        </p>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 5. full bleed

class FullBleed extends Slide {
  static path = "full";
  render() {
    return (
      <Full>
        <img src="./cover.svg" alt="" />
        <div class="caption">
          <h2>&lt;Full&gt; ignores the padding</h2>
          <p>A direct img or video child covers the slide. Text sits on top.</p>
        </div>
      </Full>
    );
  }
}

// ---------------------------------------------------------------- 6. live state

class LiveState extends Slide<{}, { count: number }> {
  static path = "state";
  state = { count: 0 };

  render() {
    return (
      <Pad>
        <h2>It is a running program</h2>
        <Cols ratio="1fr 1fr">
          <div>
            <button
              class="big"
              onClick={() => {
                this.setState((s) => ({ count: s.count + 1 }));
              }}
            >
              Pressed {this.state.count} times
            </button>
            <p class="hint">
              Clicks on a button do not turn the page, so this just works. Tapping the left quarter
              of the screen goes back — a phone has no shift key.
            </p>
          </div>
          <Code>{`class Live extends Slide<{}, { count: number }> {
  state = { count: 0 };

  render() {
    return (
      <button onClick={() =>
        this.setState(s => ({ count: s.count + 1 }))
      }>
        Pressed {this.state.count} times
      </button>
    );
  }
}`}</Code>
        </Cols>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 7. atom, written

/** Outside every slide, so leaving one does not throw it away. */
const votes = atom(0);

class AtomWrite extends Slide {
  static path = "atom";
  static notes = "Get the room to shout numbers. Press it that many times, then move on.";
  mounted() {
    this.watch(votes);
  }

  render() {
    return (
      <Pad>
        <h2>A value that outlives a slide</h2>
        <Cols ratio="1fr 1.1fr">
          <div>
            <button
              class="big"
              onClick={() => {
                votes.update((n) => n + 1);
              }}
            >
              Vote — {votes.get()}
            </button>
            <p class="hint">
              Press it a few times, then keep going. Only one slide is mounted at a time, so this
              one is about to be thrown away.
            </p>
          </div>
          <Code>{`const votes = atom(0);

class Poll extends Slide {
  mounted() { this.watch(votes); }
  cast() { votes.update(n => n + 1); }
}`}</Code>
        </Cols>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 8. atom, read back

class AtomRead extends Slide {
  static path = "kept";
  static notes = "The number survived. The slide that collected it was unmounted two presses ago.";
  mounted() {
    this.watch(votes);
  }

  render() {
    const n = votes.get();
    return (
      <Pad>
        <h2>Still here</h2>
        <div class="figure">
          <b class="accent">{n}</b>
          <span>
            {n === 0
              ? "nothing was cast — go back one slide"
              : "read from the atom, one slide later"}
          </span>
        </div>
        <p>
          Nothing was passed along. Both slides read the same atom, and <code>watch</code> drops the
          subscription when a slide leaves, so a deck does not accumulate dead listeners.
        </p>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 9. themes, live

class Themes extends Slide<{}, { at: number }> {
  static path = "themes";
  static notes = "Cycle two or three. Mention the contrast tests — a projector eats pale palettes.";
  state = { at: 0 };

  cycle = () => {
    const at = (this.state.at + 1) % THEMES.length;
    applyTheme(THEMES[at]![1]);
    this.setState({ at });
  };

  /** Leave the deck as it was found. */
  unmounted() {
    applyTheme("");
  }

  render() {
    const [name, , note] = THEMES[this.state.at]!;
    return (
      <Pad>
        <h2>Six themes, from keycap colorways</h2>
        <button class="big" onClick={this.cycle}>
          {name} — next
        </button>
        <p class="lead">{note}</p>
        <p>
          A theme is one stylesheet that overrides <code>--suraido-*</code> and nothing else. Every
          one is <strong>held to a contrast bar by tests</strong>, because a palette that reads on a
          laptop can vanish on a projector.
        </p>
        <p class="hint">Press the button. The whole deck changes; no slide was told about it.</p>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 10. overriding

class Override extends Slide {
  static path = "override";
  static steps = 3;
  render() {
    return (
      <Pad>
        <h2>Your CSS always wins</h2>
        <Cols ratio="1fr 1fr">
          <Code>{`/* every suraido.js style is inside @layer,
   and layered styles lose to unlayered ones */

.pager { display: none; }

:root {
  --suraido-accent: #d6452b;
  --suraido-pad: 88px 112px;
}`}</Code>
          <ul>
            <Step n={1}>
              <li>
                No <code>!important</code>, no specificity games
              </li>
            </Step>
            <Step n={2}>
              <li>Reach for the tokens first — one value moves the whole deck</li>
            </Step>
          </ul>
        </Cols>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 11. co-located style

class Colocated extends Slide {
  static path = "colocated";
  render() {
    return (
      <Pad>
        <h2>Styles can live in the slide</h2>
        <div class="tiles">
          <div>151</div>
          <div>6.4</div>
          <div>0</div>
        </div>
        <p>
          The tiles above are styled by a <code>&lt;style&gt;</code> element inside this slide's own{" "}
          <code>render</code>. Only one slide is mounted at a time, so it applies while this slide
          is up and leaves with it — co-location without CSS Modules.
        </p>

        <style>{`
          .tiles { display: flex; gap: 32px; margin: 16px 0 40px; }
          .tiles div {
            flex: 1;
            padding: 40px 0;
            text-align: center;
            font-size: 76px;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.03em;
            border: 3px solid var(--suraido-accent);
            border-radius: 20px;
            color: var(--suraido-accent);
          }
        `}</style>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 12. the canvas

class Canvas extends Slide<{}, { scale: string; size: string }> {
  static path = "canvas";
  state = { scale: "", size: "" };

  measure = () => {
    const scale = getComputedStyle(document.documentElement).getPropertyValue("--suraido-scale");
    this.setState({
      scale: Number(scale).toFixed(3),
      size: `${window.innerWidth}x${window.innerHeight}`,
    });
  };

  mounted() {
    this.measure();
    addEventListener("resize", this.measure);
  }

  /** Started here, so stopped here. */
  unmounted() {
    removeEventListener("resize", this.measure);
  }

  render() {
    return (
      <Pad>
        <h2>One canvas, 1920 by 1080</h2>
        <Cols ratio="1fr 1fr">
          <div>
            <p>
              Slides are drawn at a fixed size and scaled to the window, so{" "}
              <strong>px is an absolute unit here</strong>. No <code>clamp()</code>, no{" "}
              <code>vw</code>, no media queries.
            </p>
            <p class="hint">Resize the window and watch the number move.</p>
          </div>
          <div class="figure">
            <b class="accent">{this.state.scale}</b>
            <span>--suraido-scale, at {this.state.size}</span>
          </div>
        </Cols>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 13. url and motion

class Address extends Slide<{}, { hash: string }> {
  static path = "address";
  state = { hash: location.hash };

  sync = () => this.setState({ hash: location.hash });
  mounted() {
    addEventListener("hashchange", this.sync);
    this.sync();
  }
  unmounted() {
    removeEventListener("hashchange", this.sync);
  }

  render() {
    return (
      <Pad>
        <h2>Every position has an address</h2>
        <div class="figure">
          <b class="mono">{this.state.hash || "#0"}</b>
          <span>where you are, right now</span>
        </div>
        <p>
          <code>static path</code> names a slide, so the URL reads <code>#themes</code> rather than{" "}
          <code>#8</code> — and{" "}
          <strong>reordering the deck does not break the link you shared</strong>. Reload and you
          land back here.
        </p>
        <p class="hint">
          The deck also moves the way the keys do: → pushes this slide left, ← brings it back from
          the other side.
        </p>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 14. diagnostics

class Diagnostics extends Slide {
  static path = "diagnostics";
  static steps = 4;
  render() {
    return (
      <Pad>
        <h2>The mistakes that make no sound</h2>
        <p>
          A few things go wrong quietly: the deck does the wrong thing and looks fine doing it.
          Those are reported to the console, with the position and the fix.
        </p>
        <ul class="wide">
          <Step n={1}>
            <li>
              A slide that runs past the canvas — <strong>clipped, and invisible</strong>, because
              the stage is scaled down
            </li>
          </Step>
          <Step n={2}>
            <li>
              A <code>&lt;Step&gt;</code> that wrapped an <code>li</code> in a <code>div</code>
            </li>
          </Step>
          <Step n={3}>
            <li>
              A <code>static steps</code> that disagrees with the reveals on the slide
            </li>
          </Step>
        </ul>
        <p class="hint">
          Open the console: this deck is quiet. A rehearsal skill ships with every new project to
          walk the whole thing and measure.
        </p>
      </Pad>
    );
  }
}

// ---------------------------------------------------------------- 15. outro

class Outro extends Slide {
  static path = "start";
  render() {
    return (
      <Center>
        <h1>npm create suraido</h1>
        <p class="lead">
          15.5 kB, zero dependencies. One line of tsconfig, and it builds under Vite or Rsbuild
          untouched.
        </p>
        <p>
          <a href="https://github.com/L4Ph/suraido">github.com/L4Ph/suraido</a>
          {" · "}
          <a href="https://www.npmjs.com/package/suraido.js">npm</a>
        </p>
      </Center>
    );
  }
}

deck(
  [
    Cover,
    Shape,
    Steps,
    Layout,
    FullBleed,
    LiveState,
    AtomWrite,
    AtomRead,
    Themes,
    Override,
    Colocated,
    Canvas,
    Address,
    Diagnostics,
    Outro,
  ],
  { use: [presenter()] },
);
