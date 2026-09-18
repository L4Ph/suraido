import { deck, Pad, slide, Step } from "suraido.js";
import "suraido.js/deck.css";
import "./slides.css";

/**
 * The votes live outside any slide. A slide is gone the moment you move on, so anything you
 * want to show again later is kept here. Nothing subscribes to it: two slides are never on
 * screen at once, so the later one simply reads it when it is drawn.
 */
const LABELS = ["I write it", "I have seen it", "First I have heard"];
let votes = [0, 0, 0];

/** Instead of asking for a show of hands, count it here. */
const Tally = slide({ path: "tally" }, ({ update }) => {
  const bump = (i: number) => {
    votes = votes.map((n, j) => (j === i ? n + 1 : n));
    update();
  };

  return () => {
    const total = votes.reduce((a, b) => a + b, 0);
    return (
      <Pad>
        <h2>How much JSX do you write?</h2>
        <div class="poll">
          {LABELS.map((label, i) => (
            <button onClick={() => bump(i)}>
              <span class="bar" style={{ width: `${total ? (votes[i]! / total) * 100 : 0}%` }} />
              <span class="label">{label}</span>
              <span class="n">{votes[i]}</span>
            </button>
          ))}
        </div>
        <p class="hint">
          Click to add one. A plain click advances the deck, so only press on a button.
        </p>
      </Pad>
    );
  };
});

/**
 * Something that moves, drawn straight onto a canvas.
 *
 * `ref` hands the element over, `after` waits until it is on screen, and `signal` stops the loop
 * on the way out — without that, the animation keeps running behind the rest of the deck.
 */
const Animation = slide({ path: "raf" }, ({ after, signal }) => {
  let canvas!: HTMLCanvasElement;

  after(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const t0 = performance.now();
    let frame = 0;
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
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    signal.addEventListener("abort", () => cancelAnimationFrame(frame));
  });

  return (
    <Pad>
      <h2>Something that moves</h2>
      <canvas ref={(el) => (canvas = el)} width="1600" height="420" />
      <p class="hint">
        Nothing here redraws the slide. The canvas is written to directly, and the loop is tied to
        the slide's <code>signal</code>, so it stops when the slide does.
      </p>
    </Pad>
  );
});

/**
 * A text field, with no code here to look after it.
 *
 * The input is never rebuilt, so what has been typed and where the caret sits are simply still
 * there after a redraw. The value is still left in the DOM rather than kept in a variable — not
 * for focus, but because writing it back on every keystroke would move the caret to the end.
 */
const Typing = slide({ path: "input" }, ({ update }) => {
  let sent: string[] = [];

  const onKeydown = (e: KeyboardEvent) => {
    const el = e.target as HTMLInputElement;
    if (e.key !== "Enter" || !el.value.trim()) return;
    sent = [...sent, el.value.trim()];
    el.value = "";
    update();
  };

  return () => (
    <Pad>
      <h2>Taking input</h2>
      <input class="field" placeholder="Type and press Enter" onKeydown={onKeydown} />
      <ul class="answers">
        {sent.map((s) => (
          <li>{s}</li>
        ))}
      </ul>
      <Step>
        <p class="hint">
          Nothing is written back to the field while you type, and the field is never replaced, so
          it keeps your place — with no code here putting it back.
        </p>
      </Step>
    </Pad>
  );
});

/**
 * Several slides later, the same votes are still here. Nothing was passed along and nothing was
 * subscribed to: this slide reads the variable when it is drawn, which is after the voting.
 */
const Results = slide({ path: "results" }, () => {
  const total = votes.reduce((a, b) => a + b, 0);
  const winner = votes.indexOf(Math.max(...votes));

  return (
    <Pad>
      <h2>What the room said</h2>
      {total === 0 ? (
        <p class="hint">Nobody voted yet. Go back to the first slide and press a button.</p>
      ) : (
        <>
          <p>
            <strong>{LABELS[winner]}</strong> — {votes[winner]} of {total}
          </p>
          <ul class="answers">
            {LABELS.map((label, i) => (
              <li>
                {label}: {votes[i]}
              </li>
            ))}
          </ul>
        </>
      )}
      <p class="hint">
        The votes were cast on the first slide, which is long gone. They are still here because they
        are a variable in this file rather than something that slide owned.
      </p>
    </Pad>
  );
});

deck([Tally, Animation, Typing, Results]);
