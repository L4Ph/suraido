import { Center, Cols, deck, Full, Pad, slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/noel.css";
import { Code } from "./code.tsx";
import "./slides.css";
import { applyTheme, THEMES } from "./themes.ts";

const Cover = slide({ path: "intro" }, () => (
  <Center>
    <p class="eyebrow">スライド</p>
    <h1>suraido.js</h1>
    <p class="lead">
      Slides written in JSX. No React, no dependencies — and this deck is one of them.
    </p>
    <p class="hint">Press → to move. Everything here is running, not pictured.</p>
  </Center>
));

const Shape = slide({ path: "shape" }, () => (
  <Pad>
    <h2>A slide is a function</h2>
    <Cols ratio="1.1fr 1fr">
      <Code>{`const Intro = slide({ path: "intro" }, () => (
  <Pad>
    <h2>Heading</h2>
    <Step>
      <p>Later</p>
    </Step>
  </Pad>
));

deck([Intro]);`}</Code>
      <ul>
        <Step>
          <li>
            It runs once. A plain <code>let</code> in it is the slide's state
          </li>
        </Step>
        <Step>
          <li>
            <code>class</code>, not <code>className</code> — props go straight to the DOM
          </li>
        </Step>
        <Step>
          <li>
            Everything else is plain HTML: <code>img</code>, <code>video</code>, <code>svg</code>
          </li>
        </Step>
      </ul>
    </Cols>
  </Pad>
));

const Steps = slide({ path: "steps" }, () => (
  <Pad>
    <h2>Reveals hold their place</h2>
    <p>
      The four lines below are all in the DOM already. They are transparent until you reach them, so{" "}
      <strong>nothing shifts</strong> as they appear.
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
          Nothing is numbered here — a <code>&lt;Step&gt;</code> takes the one after the last
        </li>
      </Step>
      <Step n={[5, 6]}>
        <li>And a range can take something away again</li>
      </Step>
      <Step>
        <li>…so the next one arrives on the very press that removed it</li>
      </Step>
    </ul>
  </Pad>
));

const Layout = slide({ path: "layout" }, () => (
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
      This row is a <code>&lt;Cols&gt;</code>. The third card arrived as a <code>&lt;Step&gt;</code>{" "}
      and the columns did not move.
    </p>
  </Pad>
));

const FullBleed = slide({ path: "full" }, () => (
  <Full>
    <img src="./cover.svg" alt="" />
    <div class="caption">
      <h2>&lt;Full&gt; ignores the padding</h2>
      <p>A direct img or video child covers the slide. Text sits on top.</p>
    </div>
  </Full>
));

const LiveState = slide({ path: "state" }, ({ update }) => {
  let count = 0;

  return () => (
    <Pad>
      <h2>It is a running program</h2>
      <Cols ratio="1fr 1fr">
        <div>
          <button
            class="big"
            onClick={() => {
              count += 1;
              update();
            }}
          >
            Pressed {count} times
          </button>
          <p class="hint">
            Clicks on a button do not turn the page, so this just works. Tapping the left quarter of
            the screen goes back — a phone has no shift key.
          </p>
        </div>
        {/* The declaration is annotated with what the variable is right now — the source is
            still the source, and the number beside it is the one the button is moving. */}
        <Code>{`const Live = slide(({ update }) => {
  let count = 0;${count ? `   // ← ${count}` : ""}

  return () => (
    <button onClick={() => { count++; update() }}>
      Pressed {count} times
    </button>
  );
});`}</Code>
      </Cols>
    </Pad>
  );
});

/** Outside every slide, so leaving one does not throw it away. */
let votes = 0;

const Cast = slide({ path: "vote" }, ({ update }) => {
  return () => (
    <Pad>
      <h2>A value that outlives a slide</h2>
      <Cols ratio="1fr 1.1fr">
        <div>
          <button
            class="big"
            onClick={() => {
              votes += 1;
              update();
            }}
          >
            Vote — {votes}
          </button>
          <p class="hint">
            Press it a few times, then keep going. Only one slide is mounted at a time, so this one
            is about to be thrown away.
          </p>
        </div>
        <Code>{`let votes = 0;${votes ? `   // ← ${votes}` : ""}

const Poll = slide({ path: "poll" }, ({ update }) => {
  return () => (
    <button onClick={() => { votes++; update() }}>
      Vote — {votes}
    </button>
  );
});`}</Code>
      </Cols>
    </Pad>
  );
});

const Kept = slide({ path: "kept" }, () => {
  const n = votes;
  return (
    <Pad>
      <h2>Still here</h2>
      <div class="figure">
        <b class="accent">{n}</b>
        <span>
          {n === 0 ? "nothing was cast — go back one slide" : "read back, one slide later"}
        </span>
      </div>
      <p>
        Nothing was passed along and nothing subscribed to anything. Two slides are never on screen
        at once, so this one simply reads the variable when it is drawn.
      </p>
    </Pad>
  );
});

const Themes = slide({ path: "themes" }, ({ update, signal }) => {
  let at = 0;

  const cycle = () => {
    at = (at + 1) % THEMES.length;
    applyTheme(THEMES[at]![1]);
    update();
  };

  /** Leave the deck as it was found. */
  signal.addEventListener("abort", () => applyTheme(""));

  return () => {
    const [name, , note] = THEMES[at]!;
    return (
      <Pad>
        <h2>Six themes, from keycap colorways</h2>
        <button class="big" onClick={cycle}>
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
  };
});

const Override = slide({ path: "override" }, () => (
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
));

const Colocated = slide({ path: "colocated" }, () => (
  <Pad>
    <h2>Styles can live in the slide</h2>
    <div class="tiles">
      <div>151</div>
      <div>6.4</div>
      <div>0</div>
    </div>
    <p>
      The tiles above are styled by a <code>&lt;style&gt;</code> element inside this slide's own{" "}
      <code>render</code>. Only one slide is mounted at a time, so it applies while this slide is up
      and leaves with it — co-location without CSS Modules.
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
));

const Canvas = slide({ path: "canvas" }, ({ update, after, signal }) => {
  let scale = "";
  let size = "";

  const measure = () => {
    const now = getComputedStyle(document.documentElement).getPropertyValue("--suraido-scale");
    scale = Number(now).toFixed(3);
    size = `${window.innerWidth}x${window.innerHeight}`;
    update();
  };

  // --suraido-scale is set by the deck, so it is not there yet while this is being set up.
  after(measure);
  // Nothing to take off again: the signal does it.
  addEventListener("resize", measure, { signal });

  return () => (
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
          <b class="accent">{scale}</b>
          <span>--suraido-scale, at {size}</span>
        </div>
      </Cols>
    </Pad>
  );
});

const Address = slide({ path: "address" }, ({ update, signal }) => {
  let hash = location.hash;

  addEventListener(
    "hashchange",
    () => {
      hash = location.hash;
      update();
    },
    { signal },
  );

  return () => (
    <Pad>
      <h2>Every position has an address</h2>
      <div class="figure">
        <b class="mono">{hash || "#0"}</b>
        <span>where you are, right now</span>
      </div>
      <p>
        A slide's <code>path</code> names it, so the URL reads <code>#themes</code> rather than{" "}
        <code>#8</code> — and{" "}
        <strong>reordering the deck does not break the link you shared</strong>. Reload and you land
        back here.
      </p>
      <p class="hint">
        The deck also moves the way the keys do: → pushes this slide left, ← brings it back from the
        other side.
      </p>
    </Pad>
  );
});

const Diagnostics = slide({ path: "diagnostics" }, () => (
  <Pad>
    <h2>The mistakes that make no sound</h2>
    <p>
      Some things used to go wrong quietly: the deck did the wrong thing and looked fine doing it.
      The deck used to warn about them. It is better not to be able to do them.
    </p>
    <ul class="wide">
      <Step>
        <li>
          A <code>&lt;Step&gt;</code> that wrapped an <code>li</code> in a <code>div</code> — it
          marks the element you wrote, so there is nothing to wrap
        </li>
      </Step>
      <Step>
        <li>A count that disagreed with the reveals — there is no second place to say it</li>
      </Step>
      <Step>
        <li>
          A slide that was not a slide — <strong>TypeScript rejects it</strong>, before it ever runs
        </li>
      </Step>
      <Step>
        <li>
          A slide running past the canvas, clipped and invisible — measured by the tool, so none of
          this ships in your deck
        </li>
      </Step>
    </ul>
    <p class="hint">
      Nothing here writes to your console. A rehearsal skill ships with every new project to walk
      the whole thing and measure.
    </p>
  </Pad>
));

const Outro = slide({ path: "start" }, () => (
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
));

deck([
  Cover,
  Shape,
  Steps,
  Layout,
  FullBleed,
  LiveState,
  Cast,
  Kept,
  Themes,
  Override,
  Colocated,
  Canvas,
  Address,
  Diagnostics,
  Outro,
]);
