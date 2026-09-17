import { Component, flushSync, render, type Child } from "./dom.ts";
import { advance, parseHash, formatHash, type Pos, type Paths } from "./nav.ts";

/** The base class for a slide. State lives on the class, as usual. */
export abstract class Slide<P = {}, S = {}> extends Component<P, S> {
  /** How many key presses this slide absorbs. */
  static steps = 1;
  /** The name that shows in the URL. Omit it and the index is used. */
  static path?: string;
  /** What you want to be reminded of while this slide is up. Shown in the presenter view. */
  static notes?: string;
}

export type SlideComponent = (new (props: {}) => Slide<any, any>) & {
  steps?: number;
  path?: string;
  notes?: string;
};

/** Where the deck is. */
export type At = {
  index: number;
  step: number;
  steps: number;
  total: number;
  path: string;
};

/** What a plugin can learn about a slide without holding the class. */
export type SlideInfo = {
  path: string;
  steps: number;
  notes?: string;
};

/**
 * What a deck hands to the things attached to it. The whole contract: where it is, what it
 * holds, how to move it, and how to hear about it moving.
 */
export type DeckContext = {
  readonly at: At;
  readonly slides: readonly SlideInfo[];
  /** Jump to a path such as "#intro.2", or to a position. */
  go(to: string | { index: number; step?: number }): void;
  /** One step either way, spilling between slides at the ends. */
  move(by: 1 | -1): void;
  /** Returns the function that stops listening. */
  on(event: "move", run: (at: At) => void): () => void;
};

/**
 * Attached with `deck(slides, { use: [...] })`. Returning a function undoes whatever it set
 * up, and the deck calls it on the way out.
 */
export type Plugin = (deck: DeckContext) => (() => void) | void;

/** How much of the left edge sends you back rather than forward. */
const BACK_ZONE = 0.25;

// ponytail: assumes one deck at a time. For several, hang this off each Deck instance.
let deckStep = 0;

/**
 * Transparent until step n is reached, but it keeps its space so nothing shifts.
 * It decides its own state at mount; after that the Deck toggles the attribute.
 *
 * By default it builds a div. Where a div is not allowed — inside a ul, say — name the
 * element with `as`: `<ul><Step n={1} as="li">…</Step></ul>` gives you ul > li.
 */
export function Step({
  n,
  as: Tag = "div",
  class: cls,
  children,
  ...rest
}: {
  n: number;
  as?: string;
  class?: string;
  children?: Child;
  [attr: string]: unknown;
}) {
  return (
    <Tag
      class={cls ? `step ${cls}` : "step"}
      data-n={n}
      data-shown={n <= deckStep || null}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Stepping only touches the attribute, never re-rendering, so the CSS transition survives. */
function syncSteps(step: number) {
  deckStep = step;
  for (const el of document.querySelectorAll<HTMLElement>(".step[data-n]")) {
    el.toggleAttribute("data-shown", Number(el.dataset.n) <= step);
  }
}

/**
 * suraido.js has a handful of mistakes that produce no error at all: the deck simply does the
 * wrong thing quietly. A rule in a document is weaker than a word at the moment it happens,
 * so these say it out loud — to whoever, or whatever, is reading the console.
 */
function audit(slides: SlideComponent[], i: number, paths: Paths, steps: (i: number) => number) {
  const where = formatHash([i, 0], paths);
  const say = (problem: string, fix: string) =>
    console.warn(`suraido.js ${where}: ${problem}\n  ${fix}`);

  const stage = document.querySelector(".stage");
  if (stage) {
    const down = stage.scrollHeight - stage.clientHeight;
    const across = stage.scrollWidth - stage.clientWidth;
    if (down > 0 || across > 0) {
      say(
        `the slide runs ${down > 0 ? `${down}px past the bottom` : `${across}px past the right`} of the 1920x1080 canvas, and that part is clipped`,
        "Nothing on screen shows this — the whole stage is scaled down. Cut the content or raise --suraido-pad.",
      );
    }
  }

  if (document.querySelector("ul > div.step, ol > div.step")) {
    say(
      "a <Step> wrapped an <li> in a <div>, so ul > li no longer matches",
      'Pass as="li": <Step n={1} as="li">…</Step>',
    );
  }

  const shown = [...document.querySelectorAll<HTMLElement>(".step[data-n]")];
  const highest = Math.max(0, ...shown.map((el) => Number(el.dataset.n)));
  const declared = steps(i) - 1;
  if (highest !== declared) {
    say(
      `static steps declares ${declared + 1}, but the highest <Step n> here is ${highest}`,
      highest > declared
        ? `Raise it to ${highest + 1}, or those reveals never appear.`
        : `Lower it to ${highest + 1}, or ${declared - highest} key press(es) do nothing.`,
    );
  }
}

type DeckProps = { slides: SlideComponent[]; width?: number; height?: number };

export class Deck extends Component<DeckProps, { i: number }> {
  paths: Paths = this.props.slides.map((s) => s.path);
  steps = (i: number) => this.props.slides[i]?.steps ?? 1;
  /** Where we are. Only a change of slide reaches state and redraws. */
  pos: Pos = parseHash(location.hash, this.paths, this.steps);
  state = { i: this.pos[0] };

  constructor(props: DeckProps) {
    super(props);
    props.slides.forEach((slide, i) => {
      if (typeof slide !== "function" || typeof slide.prototype?.render !== "function") {
        console.warn(
          `suraido.js: slides[${i}] is not a Slide subclass.\n` +
            "  Wrapping one in a function drops its static steps and path, so reveals and URLs stop working.",
        );
      }
    });
    // So a deep link that carries a step is honoured from the very first render.
    // Forget this and reveals are missing on exactly those links.
    deckStep = this.pos[1];
  }

  go = (next: Pos) => {
    const slideChanged = next[0] !== this.pos[0];
    // Which way the deck is moving, so the transition can move the same way.
    // Read it before pos is overwritten.
    const dir = next[0] > this.pos[0] ? "forward" : "back";
    this.pos = next;
    deckStep = next[1];

    const hash = formatHash(next, this.paths);
    if (location.hash !== hash) history.replaceState(null, "", hash);

    this.announce(next);

    // A step on its own is just an attribute.
    if (!slideChanged) return syncSteps(next[1]);

    // Swap the slide. View Transitions want the DOM change finished inside the callback.
    const swap = () => {
      this.setState({ i: next[0] });
      flushSync();
      // Inside the swap, not after it: startViewTransition defers the callback, so measuring
      // outside would read the slide that is still on screen.
      this.check();
    };
    document.documentElement.dataset.suraidoDir = dir;
    if (document.startViewTransition) document.startViewTransition(swap);
    else swap();
  };

  move = (dir: 1 | -1) => this.go(advance(this.pos, dir, this.steps, this.props.slides.length));

  onKey = (e: KeyboardEvent) => {
    const dir = {
      ArrowRight: 1,
      ArrowDown: 1,
      " ": 1,
      PageDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
      PageUp: -1,
    }[e.key];
    if (dir) this.move(dir as 1 | -1);
    else if (e.key === "Home") this.go([0, 0]);
    else if (e.key === "End")
      this.go([this.props.slides.length - 1, this.steps(this.props.slides.length - 1) - 1]);
    else if (e.key === "f")
      void (document.fullscreenElement
        ? document.exitFullscreen()
        : document.body.requestFullscreen());
    else return;
    e.preventDefault();
  };

  onHash = () => this.go(parseHash(location.hash, this.paths, this.steps));

  /**
   * Tapping the left edge goes back, anywhere else goes forward. A phone has no shift key, so
   * without a zone a touch deck could only ever move one way.
   *
   * Anything you could have meant to press is left alone, so a link or a button in a slide
   * does not also turn the page.
   */
  onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (target?.closest("a, button, input, select, textarea, label, [data-suraido-keep]")) return;
    const back = e.shiftKey || e.clientX < innerWidth * BACK_ZONE;
    this.move(back ? -1 : 1);
  };

  /** The scale is a variable on :root, so it drags in neither a re-render nor a swap. */
  fit = () => {
    const { width = 1920, height = 1080 } = this.props;
    const scale = Math.min(innerWidth / width, innerHeight / height);
    document.documentElement.style.setProperty("--suraido-scale", String(scale));
  };

  mounted() {
    addEventListener("keydown", this.onKey);
    addEventListener("hashchange", this.onHash);
    addEventListener("resize", this.fit);
    this.fit();
    // Normalise the URL and match the attributes to it, rounding an out-of-range step.
    this.go(this.pos);
    this.check();
  }

  /** @internal */ listeners = new Set<(at: At) => void>();
  /** @internal */ teardown: (() => void)[] = [];

  /** @internal */ snapshot([i, step]: Pos = this.pos): At {
    return {
      index: i,
      step,
      steps: this.steps(i),
      total: this.props.slides.length,
      path: formatHash([i, step], this.paths),
    };
  }

  announce(next: Pos) {
    const at = this.snapshot(next);
    // Same reason as the atom: a listener that attaches another one mid-notification would
    // otherwise see it run in the same pass. Notify the set as it stood.
    // oxlint-disable-next-line no-useless-spread -- the copy is the point
    for (const run of [...this.listeners]) run(at);
  }

  /** Measured a frame later, once layout has settled. */
  check = () => {
    requestAnimationFrame(() => audit(this.props.slides, this.pos[0], this.paths, this.steps));
  };

  unmounted() {
    // Reverse of the order they were attached, so a plugin unwinds after anything it set up.
    for (const off of this.teardown.reverse()) off();
    this.teardown.length = 0;
    this.listeners.clear();
    removeEventListener("keydown", this.onKey);
    removeEventListener("hashchange", this.onHash);
    removeEventListener("resize", this.fit);
  }

  render() {
    const { slides, width = 1920, height = 1080 } = this.props;
    const Current = slides[this.state.i];

    return (
      <div class="deck" onClick={this.onClick}>
        <div class="stage" style={{ width: `${width}px`, height: `${height}px` }}>
          <Current />
        </div>
        <div class="pager">{`${this.state.i + 1} / ${slides.length}`}</div>
      </div>
    );
  }
}

export type DeckOptions = Omit<DeckProps, "slides"> & {
  /** Things attached to this deck — the presenter view, sync, anything. */
  use?: Plugin[];
};

/**
 * Starts a deck. It mounts into #root, or makes a container on body if there is none.
 *
 * Whatever is in `use` is handed the deck and can move it, read it and hear about it. The
 * context is returned as well, for a test or for reaching in from elsewhere.
 */
export function deck(slides: SlideComponent[], { use = [], ...opts }: DeckOptions = {}) {
  const host =
    document.getElementById("root") ?? document.body.appendChild(document.createElement("div"));
  const mounted = render(<Deck slides={slides} {...opts} />, host);
  const self = mounted.comp as Deck;

  const context: DeckContext = {
    get at() {
      return self.snapshot();
    },
    get slides() {
      return slides.map((slide, i) => ({
        path: formatHash([i, 0], self.paths),
        steps: slide.steps ?? 1,
        notes: slide.notes,
      }));
    },
    go(to) {
      self.go(
        typeof to === "string" ? parseHash(to, self.paths, self.steps) : [to.index, to.step ?? 0],
      );
    },
    move(by) {
      self.move(by);
    },
    on(_event, run) {
      self.listeners.add(run);
      return () => self.listeners.delete(run);
    },
  };

  // Before mounted() runs — it normalises the URL, and a plugin should hear that too.
  for (const plugin of use) {
    const off = plugin(context);
    if (off) self.teardown.push(off);
  }

  return context;
}
