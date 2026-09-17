import { deck, Pad, Slide, Step } from "todan";
import "todan/deck.css";
import "./slides.css";

/** Instead of asking for a show of hands, count it here. */
class Tally extends Slide<{}, { counts: number[] }> {
  static path = "tally";
  static labels = ["I write it", "I have seen it", "First I have heard"];
  state = { counts: [0, 0, 0] };

  bump(i: number) {
    this.setState((s) => ({ counts: s.counts.map((n, j) => (j === i ? n + 1 : n)) }));
  }

  render() {
    const total = this.state.counts.reduce((a, b) => a + b, 0);
    return (
      <Pad>
        <h2>How much JSX do you write?</h2>
        <div class="poll">
          {Tally.labels.map((label, i) => {
            const n = this.state.counts[i];
            return (
              <button
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  this.bump(i);
                }}
              >
                <span class="bar" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
                <span class="label">{label}</span>
                <span class="n">{n}</span>
              </button>
            );
          })}
        </div>
        <p class="hint">
          Click to add one. A plain click advances the deck, so only press on a button.
        </p>
      </Pad>
    );
  }
}

/**
 * Embedding something that moves. It touches the DOM directly instead of calling setState,
 * so the slide is never rebuilt and the drawing never breaks.
 */
class Animation extends Slide {
  static path = "raf";
  canvas: HTMLCanvasElement | null = null;
  raf = 0;

  mounted() {
    this.canvas = document.querySelector("#wave");
    const ctx = this.canvas?.getContext("2d");
    if (!ctx) return;
    const t0 = performance.now();
    const draw = (t: number) => {
      const { width: w, height: h } = ctx.canvas;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue(
        "--todan-accent",
      );
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = h / 2 + Math.sin((x + (t - t0) / 4) / 90) * (h / 3) * Math.sin((t - t0) / 1600);
        if (x) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
  }

  /** Stop on the way out. Without this it keeps running behind the deck. */
  unmounted() {
    cancelAnimationFrame(this.raf);
  }

  render() {
    return (
      <Pad>
        <h2>Something that moves</h2>
        <canvas id="wave" width="1600" height="420" />
        <p class="hint">
          <code>mounted()</code> starts the rAF loop and <code>unmounted()</code> stops it. No
          setState, so nothing is ever rebuilt.
        </p>
      </Pad>
    );
  }
}

/**
 * setState rebuilds the DOM, and a text field feels that twice over.
 *
 *  1. Calling setState on every keystroke throws focus away each time
 *     → leave the value in the DOM and move it into state only once it is committed
 *  2. Even the setState on commit rebuilds the input
 *     → put focus back in updated()
 */
class Typing extends Slide<{}, { submitted: string[] }> {
  static path = "input";
  static steps = 2;
  state = { submitted: [] as string[] };

  /** Runs right after the rebuild. Hands focus back so you can keep typing. */
  updated() {
    document.querySelector<HTMLInputElement>(".field")?.focus();
  }

  onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLInputElement;
    if (e.key !== "Enter" || !el.value.trim()) return;
    const value = el.value.trim();
    el.value = "";
    this.setState((s) => ({ submitted: [...s.submitted, value] }));
  };

  render() {
    return (
      <Pad>
        <h2>Taking input</h2>
        <input
          class="field"
          placeholder="Type and press Enter"
          onKeydown={this.onKey}
          onClick={(e: MouseEvent) => e.stopPropagation()}
        />
        <ul class="answers">
          {this.state.submitted.map((s) => (
            <li>{s}</li>
          ))}
        </ul>
        <Step n={1}>
          <p class="hint">
            No setState while typing — the value stays in the DOM. It moves into state on Enter, and{" "}
            <code>updated()</code> returns focus to the rebuilt field.
          </p>
        </Step>
      </Pad>
    );
  }
}

deck([Tally, Animation, Typing]);
