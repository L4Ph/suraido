---
name: rehearse
description: Rehearse a suraido.js deck — open every slide and measure what the eye cannot catch: content clipped by the fixed canvas, text too faint to read from the back of a room, images that never loaded. Use when the user asks to check, review, or rehearse a deck or whether it is ready to present, or reports that something looks cut off or missing.
---

# Rehearse

A suraido.js slide is drawn on a fixed 1920x1080 canvas, and `.stage` is `overflow: hidden`.
**Anything that does not fit is clipped, with no warning.** The whole stage is scaled
down to the window, so a clipped slide still looks composed on screen. You find out on
stage.

Measure. Do not look — clipping is invisible to the eye.

## 1. Build the running order

Read the `deck([...])` array and write down **one position per slide**: `#<path>` for a
class with `static path`, `#<index>` otherwise.

Do not walk every step. `<Step>` holds its space while hidden, so revealing one changes
nothing about height. The exception is a deck that overrides `.step` to `display: none`
— walk every step of those slides.

Done when: the list has one entry per slide in the deck.

## 2. Check the deck against its rules

Open `AGENTS.md` and take the rules under "Rules" one at a time, hunting the whole deck
for violations of each. No browser needed.

Done when: every rule has been checked against every slide.

## 3. Rehearse

Start the dev server and open each position in the running order. One call per position
gets all three:

```js
const s = document.querySelector(".stage");
({
  clippedY: s.scrollHeight - s.clientHeight, // > 0 → cut off at the bottom
  clippedX: s.scrollWidth - s.clientWidth, // > 0 → cut off at the right
  brokenImages: [...s.querySelectorAll("img")]
    .filter((i) => i.naturalWidth === 0)
    .map((i) => i.getAttribute("src")),
});
```

Read the console at each position too. suraido.js reports the mistakes it would otherwise make
silently, and it has already done the measuring for you.

Also weigh body text against its background: below 4.5:1 will not carry to the back of
a room, however good it looks on a laptop.

Done when: **every position in the running order** has numbers against it. Do not stop
after a few slides that came back clean — clipping is per-slide, and the clean ones say
nothing about the rest.

## 4. Report

For each position with a problem, give the `#<path>`, the measurement (pixels clipped,
contrast ratio, image src) and the element causing it. If nothing is wrong, say so and
give the number of slides walked.

Report first. Do not fix unless asked.
