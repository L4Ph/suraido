import { Component, flushSync, render, type Child, type VNode } from "./dom.ts";
import { advance, parseHash, formatHash, LAST, type Pos, type Paths } from "./nav.ts";

/** The base class for a slide. State lives on the class, as usual. */
export abstract class Slide<P = {}, S = {}> extends Component<P, S> {
  /**
   * How many stops this slide has, when you want to say. Left out — which is usually right —
   * it is counted from the reveals the slide draws.
   */
  static steps?: number;
  /** The name that shows in the URL. Omit it and the index is used. */
  static path?: string;
  /** What you want to be reminded of while this slide is up. Read by whatever shows notes. */
  static notes?: string;

  /** @internal Redrawing itself must number its reveals the same way it did the first time. */
  $enter = () => {
    scope.counted = 0;
  };
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

/**
 * What a plugin can learn about a slide without holding the class.
 *
 * How many stops a slide has is not here: it is counted from what the slide drew, so for a
 * slide that has not been on screen yet there is no answer. `At.steps` says it for the one
 * that is.
 */
export type SlideInfo = {
  path: string;
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

/**
 * What the slide currently being built needs to know: which step it is showing, and how far
 * the numbering has got, so a <Step> that was given no number can take the next one.
 *
 * It is set and never restored, which is safe because mount() descends depth-first in document
 * order: a slide's whole subtree is finished before the next SlideAt is reached. That is what
 * lets a single page hold several slides each showing a different amount — which is all that
 * printing and the overview are.
 */
let scope = { step: 0, counted: 0 };

/**
 * Where a reveal comes in and, if it ever does, where it goes away again.
 *
 * No number means the one after the last, so inserting a reveal does not renumber the ones
 * below it. A number given by hand carries the counting forward from there, so mixing the two
 * stays in order.
 */
function position(n: number | [number, number] | undefined): [enter: number, until: number] {
  if (n === undefined) return [++scope.counted, Infinity];
  const [enter, until = Infinity] = Array.isArray(n) ? n : [n];
  // A range counts as reaching the step before it ends, so the next unnumbered reveal lands on
  // the step it goes away — one press swapping this for that, rather than a blank press between.
  scope.counted = Math.max(scope.counted, Number.isFinite(until) ? until - 1 : enter);
  return [enter, until];
}

const classes = (...parts: unknown[]) => parts.filter(Boolean).join(" ");

/**
 * The one element a mark can be put on, or nothing when there is not exactly one — bare text,
 * several children, or a component, which may never pass the attributes on to anything.
 */
function markable(children: Child): VNode | undefined {
  // Whitespace on the same line survives the JSX transform, so `<Step> <li/> </Step>` arrives
  // as three children. Counting it would quietly put the wrapper back, and there is no longer
  // a warning to catch that.
  const real = (Array.isArray(children) ? children : [children]).filter(
    (c) => !(c == null || typeof c === "boolean" || (typeof c === "string" && !c.trim())),
  );
  const only = real.length === 1 ? real[0] : undefined;
  return only && typeof only === "object" && !Array.isArray(only) && typeof only.type === "string"
    ? only
    : undefined;
}

/**
 * Transparent until step n is reached, but it keeps its space so nothing shifts.
 * It decides its own state at mount; after that the Deck toggles the attribute.
 *
 * It marks the element you already wrote rather than adding one around it, so a reveal inside
 * a <ul> is still an <li> and `ul > li` goes on matching. Only when there is no single element
 * to mark does it build a div to hold the mark.
 */
export function Step({
  n,
  class: cls,
  children,
  ...rest
}: {
  /** Omit it for the next one. A pair is [comes in, goes away), like Slidev's v-click. */
  n?: number | [number, number];
  class?: string;
  children?: Child;
  [attr: string]: unknown;
}): Child {
  const [enter, until] = position(n);
  const mark = {
    "data-n": enter,
    "data-until": Number.isFinite(until) ? until : null,
    "data-shown": (enter <= scope.step && scope.step < until) || null,
    ...rest,
  };
  const target = markable(children);

  if (target) {
    return {
      ...target,
      props: { ...target.props, ...mark, class: classes(target.props.class, "step", cls) },
    };
  }
  return (
    <div class={classes("step", cls)} {...mark}>
      {children}
    </div>
  );
}

/**
 * Stepping only touches the attribute, never re-rendering, so the CSS transition survives.
 * Scoped to one deck's own stage: another deck on the page is not this deck's business.
 *
 * It also writes the step back, because a slide that redraws itself — a vote coming in, a
 * timer — rebuilds its subtree without passing through SlideAt again, and every <Step> in it
 * would otherwise be built against whatever step was last mounted and come back hidden.
 *
 * ponytail: that write is one value for the page. A slide calling setState while other slides
 * are on screen (printing, overview) would read the wrong one. Give each Slide its own scope
 * if that combination ever has to work.
 */
function syncSteps(root: ParentNode, step: number) {
  scope.step = step;
  for (const el of root.querySelectorAll<HTMLElement>(".step[data-n]")) {
    const until = el.dataset.until ? Number(el.dataset.until) : Infinity;
    el.toggleAttribute("data-shown", Number(el.dataset.n) <= step && step < until);
  }
}

/**
 * One slide, shown at one step. The wrapper exists only to say which step, so that <Step>
 * does not have to ask a global what the deck as a whole is doing.
 */
function SlideAt({ slide: S, step }: { slide: SlideComponent; step: number }) {
  scope = { step, counted: 0 };
  return <S />;
}

type DeckProps = { slides: SlideComponent[]; width?: number; height?: number };

export class Deck extends Component<DeckProps, { i: number }> {
  paths: Paths = this.props.slides.map((s) => s.path);
  /** Counted from what each slide drew, once it has been drawn. */
  measured: number[] = [];
  steps = (i: number) => this.props.slides[i]?.steps ?? this.measured[i] ?? 1;
  /** Where we are. Only a change of slide reaches state and redraws. */
  pos: Pos = parseHash(location.hash, this.paths);
  state = { i: this.pos[0] };

  /** This deck's own slide area, so stepping does not reach into anyone else's. */
  get stage(): ParentNode {
    const root = this.$el as Element;
    // Falling back to the deck's own root rather than the document: if the stage is ever not
    // found, the blast radius stays inside this deck instead of becoming every deck on the page.
    return root.querySelector(".stage") ?? root;
  }

  /** How many stops this slide has, counted from what it actually drew. */
  measure() {
    const marks = [...this.stage.querySelectorAll<HTMLElement>(".step[data-n]")];
    // A reveal that goes away again needs the step it goes away on to exist, or it is never
    // seen gone.
    const highest = Math.max(
      0,
      ...marks.flatMap((el) => [Number(el.dataset.n), Number(el.dataset.until ?? 0)]),
    );
    this.measured[this.pos[0]] = highest + 1;
  }

  /**
   * Once the slide is on screen its reveals can be counted, and only then is it known what
   * "the last step" — or a step in the URL that runs past the end — actually means. So the URL
   * and everything listening are told here rather than before the slide was drawn.
   */
  settle() {
    this.measure();
    const [i, step] = this.pos;
    this.pos = [i, Math.min(step, this.steps(i) - 1)];
    syncSteps(this.stage, this.pos[1]);

    const hash = formatHash(this.pos, this.paths);
    if (location.hash !== hash) history.replaceState(null, "", hash);
    this.announce(this.pos);
  }

  go = (next: Pos) => {
    const slideChanged = next[0] !== this.pos[0];
    // Which way the deck is moving, so the transition can move the same way.
    // Read it before pos is overwritten.
    const dir = next[0] > this.pos[0] ? "forward" : "back";
    this.pos = next;

    // A step on its own is just an attribute.
    if (!slideChanged) return this.settle();

    // Swap the slide. View Transitions want the DOM change finished inside the callback.
    const swap = () => {
      this.setState({ i: next[0] });
      flushSync();
      // Inside the swap, not after it: startViewTransition defers the callback, so measuring
      // outside would read the slide that is still on screen.
      this.settle();
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
    else if (e.key === "End") this.go([this.props.slides.length - 1, LAST]);
    else if (e.key === "f")
      void (document.fullscreenElement
        ? document.exitFullscreen()
        : document.body.requestFullscreen());
    else return;
    e.preventDefault();
  };

  onHash = () => this.go(parseHash(location.hash, this.paths));

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
          {/* The step goes in with the slide so a deep link that carries one is honoured from
              the very first render. Drop it and reveals are missing on exactly those links. */}
          <SlideAt slide={Current} step={this.pos[1]} />
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
        notes: slide.notes,
      }));
    },
    go(to) {
      self.go(typeof to === "string" ? parseHash(to, self.paths) : [to.index, to.step ?? 0]);
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
