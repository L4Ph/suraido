/**
 * Reading a built deck by driving it, rather than by asking it anything.
 *
 * The deck writes where it is into the URL, and that is the whole interface used here. Nothing
 * has to be exported from the page, and a deck built by an older version still works.
 */

import type { Page } from "puppeteer-core";

/** Where a slide is, and whether it fits. */
export type Shot = { at: string; over?: { down: number; across: number } };

/**
 * The canvas the deck was built at, read from the deck rather than assumed.
 *
 * offsetWidth, not a bounding rect: the stage is scaled to whatever window it is in, and a
 * rect would report the size it was shrunk to rather than the size it was written at.
 */
export async function canvas(page: Page): Promise<{ width: number; height: number }> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(".stage");
    return { width: stage?.offsetWidth || 1920, height: stage?.offsetHeight || 1080 };
  });
}

/** Press forward until the deck stops moving, collecting every position it stops at. */
export async function walk(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const settled = async (was: string) => {
      for (let i = 0; i < 60 && location.hash === was; i++) {
        await new Promise((r) => setTimeout(r, 25));
      }
      return location.hash;
    };

    location.hash = "";
    await new Promise((r) => setTimeout(r, 300));

    const stops = [location.hash];
    // A deck is finite, but a bug in it need not be: stop counting well before a hang.
    for (let i = 0; i < 2000; i++) {
      const was = location.hash;
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
      const now = await settled(was);
      if (now === was) break;
      stops.push(now);
    }
    return stops;
  });
}

/** Put the deck at one position and wait for it to be still. */
export async function stand(page: Page, at: string): Promise<Shot> {
  return page.evaluate(async (want) => {
    if (location.hash !== want) {
      location.hash = want;
      await new Promise((r) => setTimeout(r, 120));
    }
    // Two frames: one for the slide to be built, one for it to have been laid out.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await document.fonts.ready;

    // The stage is a fixed box that the page scales down, so anything past its edges is cut
    // off and nothing on screen says so. This is the one thing about a deck that cannot be
    // known without drawing it.
    const stage = document.querySelector(".stage");
    const down = stage ? stage.scrollHeight - stage.clientHeight : 0;
    const across = stage ? stage.scrollWidth - stage.clientWidth : 0;

    return down > 0 || across > 0
      ? { at: location.hash, over: { down, across } }
      : { at: location.hash };
  }, at);
}

/** The last stop on each slide: everything revealed, one page per slide. */
export const settled = (stops: string[]): string[] => {
  const last = new Map<string, string>();
  for (const at of stops) last.set(at.split(".")[0]!, at);
  return [...last.values()];
};
