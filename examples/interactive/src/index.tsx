import { atom } from "@suraido/atom";
import { deck, Pad, Slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "./slides.css";

/**
 * The votes live outside any slide. A slide unmounts the moment you move on, so anything you
 * want to show again later has to be kept here instead of in its state.
 */
const LABELS = ["I write it", "I have seen it", "First I have heard"];
const votes = atom([0, 0, 0]);

/** Instead of asking for a show of hands, count it here. */
class Tally extends Slide {
  static path = "tally";

  mounted() {
    this.watch(votes);
  }

  bump(i: number) {
    votes.update((counts) => counts.map((n, j) => (j === i ? n + 1 : n)));
  }

  render() {
    const counts = votes.get();
    const total = counts.reduce((a, b) => a + b, 0);
    return (
      <Pad>
        <h2>How much JSX do you write?</h2>
        <div class="poll">
          {LABELS.map((label, i) => {
            const n = counts[i];
            return (
              <button
                onClick={() => {
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
        "--suraido-accent",
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
          <code>mounted()</code> starts the animation and <code>unmounted()</code> stops it. No
          setState, so nothing is ever rebuilt.
        </p>
      </Pad>
    );
  }
}

/**
 * A text field, with no code here to look after it.
 *
 * The input is never rebuilt, so what has been typed and where the caret sits are simply still
 * there after a redraw. The value is still left in the DOM rather than mirrored into state —
 * not for focus any more, but because writing `value` back on every keystroke would move the
 * caret to the end.
 */
class Typing extends Slide<{}, { submitted: string[] }> {
  static path = "input";
  state = { submitted: [] as string[] };

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
        <input class="field" placeholder="Type and press Enter" onKeydown={this.onKey} />
        <ul class="answers">
          {this.state.submitted.map((s) => (
            <li>{s}</li>
          ))}
        </ul>
        <Step n={1}>
          <p class="hint">
            No setState while typing — the value stays in the DOM. On Enter it moves into state, and
            the field carries on: it is the element that was always there.
          </p>
        </Step>
      </Pad>
    );
  }
}

/**
 * Several slides later, the same votes are still here. Nothing was passed along: both slides
 * read the same atom, and watch() redraws this one if the count moves while it is on screen.
 */
class Results extends Slide {
  static path = "results";

  mounted() {
    this.watch(votes);
  }

  render() {
    const counts = votes.get();
    const total = counts.reduce((a, b) => a + b, 0);
    const winner = counts.indexOf(Math.max(...counts));

    return (
      <Pad>
        <h2>What the room said</h2>
        {total === 0 ? (
          <p class="hint">Nobody voted yet. Go back to the first slide and press a button.</p>
        ) : (
          <>
            <p>
              <strong>{LABELS[winner]}</strong> — {counts[winner]} of {total}
            </p>
            <ul class="answers">
              {LABELS.map((label, i) => (
                <li>
                  {label}: {counts[i]}
                </li>
              ))}
            </ul>
          </>
        )}
        <p class="hint">
          The votes were cast on the first slide, which unmounted when you left it. They survive
          because they live in an atom rather than in that slide.
        </p>
      </Pad>
    );
  }
}

deck([Tally, Animation, Typing, Results]);
