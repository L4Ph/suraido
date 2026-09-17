import { Component, flushSync, render, type Child } from "./dom.ts";
import { advance, parseHash, formatHash, type Pos, type Paths } from "./nav.ts";

/** The base class for a slide. State lives on the class, as usual. */
export abstract class Slide<P = {}, S = {}> extends Component<P, S> {
  /** How many key presses this slide absorbs. */
  static steps = 1;
  /** The name that shows in the URL. Omit it and the index is used. */
  static path?: string;
}

export type SlideComponent = (new (props: {}) => Slide<any, any>) & {
  steps?: number;
  path?: string;
};

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

type DeckProps = { slides: SlideComponent[]; width?: number; height?: number };

export class Deck extends Component<DeckProps, { i: number }> {
  paths: Paths = this.props.slides.map((s) => s.path);
  steps = (i: number) => this.props.slides[i]?.steps ?? 1;
  /** Where we are. Only a change of slide reaches state and redraws. */
  pos: Pos = parseHash(location.hash, this.paths, this.steps);
  state = { i: this.pos[0] };

  constructor(props: DeckProps) {
    super(props);
    // So a deep link that carries a step is honoured from the very first render.
    // Forget this and reveals are missing on exactly those links.
    deckStep = this.pos[1];
  }

  go = (next: Pos) => {
    const slideChanged = next[0] !== this.pos[0];
    this.pos = next;
    deckStep = next[1];

    const hash = formatHash(next, this.paths);
    if (location.hash !== hash) history.replaceState(null, "", hash);

    // A step on its own is just an attribute.
    if (!slideChanged) return syncSteps(next[1]);

    // Swap the slide. View Transitions want the DOM change finished inside the callback.
    const swap = () => {
      this.setState({ i: next[0] });
      flushSync();
    };
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

  /** The scale is a variable on :root, so it drags in neither a re-render nor a swap. */
  fit = () => {
    const { width = 1920, height = 1080 } = this.props;
    const scale = Math.min(innerWidth / width, innerHeight / height);
    document.documentElement.style.setProperty("--todan-scale", String(scale));
  };

  mounted() {
    addEventListener("keydown", this.onKey);
    addEventListener("hashchange", this.onHash);
    addEventListener("resize", this.fit);
    this.fit();
    // Normalise the URL and match the attributes to it, rounding an out-of-range step.
    this.go(this.pos);
  }

  unmounted() {
    removeEventListener("keydown", this.onKey);
    removeEventListener("hashchange", this.onHash);
    removeEventListener("resize", this.fit);
  }

  render() {
    const { slides, width = 1920, height = 1080 } = this.props;
    const Current = slides[this.state.i];

    return (
      <div class="deck" onClick={(e: MouseEvent) => this.move(e.shiftKey ? -1 : 1)}>
        <div class="stage" style={{ width: `${width}px`, height: `${height}px` }}>
          <Current />
        </div>
        <div class="pager">{`${this.state.i + 1} / ${slides.length}`}</div>
      </div>
    );
  }
}

/**
 * Starts a deck. It mounts into #root, or makes a container on body if there is none.
 * With this there is nothing to keep beyond the file that lists the slides.
 */
export function deck(slides: SlideComponent[], opts: Omit<DeckProps, "slides"> = {}) {
  const host =
    document.getElementById("root") ?? document.body.appendChild(document.createElement("div"));
  render(<Deck slides={slides} {...opts} />, host);
}
