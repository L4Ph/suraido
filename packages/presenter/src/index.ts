import type { At, DeckContext, Plugin, SlideInfo } from "suraido.js";

/**
 * A second window for the person talking: the notes for this slide, what is coming, the clock,
 * and where you are. The deck stays on the projector.
 *
 * Opt in, because not everyone presents from a machine with two screens:
 *
 *     import { presenter } from "@suraido/presenter";
 *     deck(slides, { use: [presenter()] });
 *
 * The two windows talk over a BroadcastChannel, which reaches same-origin windows in the same
 * browser — enough for a laptop and a projector, not enough for the audience's phones.
 */

export type PresenterOptions = {
  /** The key that opens it. */
  key?: string;
  /** Name the channel to run more than one deck at once. */
  channel?: string;
};

/**
 * What the two windows say to each other.
 *
 * `move` is relative, which is right here because there is exactly one deck: the presenter
 * window only displays. Anything with several decks — syncing a room, say — has to send `go`
 * instead, or two that drift apart never come back together.
 */
type Packet = { show: Shown } | { move: 1 | -1 } | { go: string };

/** Everything the second window draws. Composed here so it stays a dumb display. */
type Shown = At & { notes?: string; next?: SlideInfo };

const STYLE = `
  :root { color-scheme: dark; }
  body {
    margin: 0; padding: 48px 56px; min-height: 100vh; box-sizing: border-box;
    background: #14161a; color: #e9ecef; display: flex; flex-direction: column; gap: 32px;
    font: 16px/1.6 system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif;
  }
  header { display: flex; align-items: baseline; gap: 28px; }
  .clock { font-size: 68px; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  .at { font-size: 22px; color: #9aa4ae; font-variant-numeric: tabular-nums; }
  .where { margin-left: auto; font-size: 22px; color: #9aa4ae; font-family: ui-monospace, monospace; }
  h2 { margin: 0 0 12px; font-size: 15px; letter-spacing: 0.16em; text-transform: uppercase; color: #8b95a0; }
  .notes { flex: 1; font-size: 30px; line-height: 1.55; white-space: pre-wrap; }
  .notes:empty::after { content: "no notes on this slide"; color: #5c666f; font-size: 22px; }
  .next { border-top: 1px solid #2a2f36; padding-top: 24px; }
  .next p { margin: 0; font-size: 20px; color: #9aa4ae; white-space: pre-wrap; }
  .next p:empty::after { content: "—"; }
  footer { font-size: 15px; color: #5c666f; }
  kbd { background: #23272e; border-radius: 5px; padding: 2px 7px; font: inherit; }
`;

const BODY = `
  <header>
    <span class="clock" id="clock">0:00</span>
    <span class="at" id="at"></span>
    <span class="where" id="where"></span>
  </header>
  <section style="flex:1;display:flex;flex-direction:column">
    <h2>Notes</h2>
    <div class="notes" id="notes"></div>
  </section>
  <section class="next">
    <h2 id="next-label">Next</h2>
    <p id="next"></p>
  </section>
  <footer>Arrow keys work here too. <kbd>r</kbd> restarts the clock.</footer>
`;

const mmss = (ms: number) => {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export function presenter({ key = "p", channel = "suraido" }: PresenterOptions = {}): Plugin {
  return (deck: DeckContext) => {
    const wire = new BroadcastChannel(channel);
    let last: Shown | undefined;

    const compose = (at: At): Shown => ({
      ...at,
      notes: deck.slides[at.index]?.notes,
      next: deck.slides[at.index + 1],
    });

    // Kept, so a window opened halfway through a talk is not blank.
    const offMove = deck.on("move", (at) => {
      last = compose(at);
      wire.postMessage({ show: last } satisfies Packet);
    });

    wire.addEventListener("message", (e: MessageEvent<Packet>) => {
      if ("move" in e.data) deck.move(e.data.move);
      else if ("go" in e.data) deck.go(e.data.go);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== key || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      open(last ?? compose(deck.at), channel);
    };
    addEventListener("keydown", onKey);

    return () => {
      offMove();
      removeEventListener("keydown", onKey);
      wire.close();
    };
  };
}

function open(last: Shown, channel: string) {
  const win = window.open("", "suraido-presenter", "width=900,height=680");
  if (!win) {
    // Pressing the key and having nothing happen is the worst outcome; say why.
    console.warn(
      "suraido: the presenter window was blocked.\n" +
        "  Allow pop-ups for this page, then press the key again.",
    );
    return;
  }

  const doc = win.document;
  doc.title = "suraido.js — presenter";
  doc.head.innerHTML = `<meta charset="utf-8"><style>${STYLE}</style>`;
  doc.body.innerHTML = BODY;

  const el = (id: string) => doc.getElementById(id)!;
  const wire = new BroadcastChannel(channel);
  let started = Date.now();

  const draw = (m: Shown) => {
    el("at").textContent =
      `${m.index + 1} / ${m.total}${m.steps > 1 ? `  ·  step ${m.step + 1}/${m.steps}` : ""}`;
    el("where").textContent = m.path;
    el("notes").textContent = m.notes ?? "";
    el("next").textContent = m.next?.notes ?? "";
    el("next-label").textContent = m.next ? `Next — ${m.next.path}` : "Last slide";
  };

  draw(last);
  wire.addEventListener("message", (e: MessageEvent<Packet>) => {
    if ("show" in e.data) draw(e.data.show);
  });

  win.addEventListener("keydown", (e) => {
    if (e.key === "r") {
      started = Date.now();
      return;
    }
    const by = { ArrowRight: 1, ArrowDown: 1, " ": 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (by) wire.postMessage({ move: by as 1 | -1 } satisfies Packet);
  });

  const tick = win.setInterval(() => {
    el("clock").textContent = mmss(Date.now() - started);
  }, 250);

  // Closing the window leaves nothing running behind it.
  win.addEventListener("pagehide", () => {
    win.clearInterval(tick);
    wire.close();
  });
}
