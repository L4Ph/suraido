/**
 * A deck on paper, or as images.
 *
 * The deck is not asked to render itself differently. A browser opens it, walks it the way a
 * presenter would, and takes what is on screen at each stop — so what comes out is what the
 * room would have seen, and there is no second rendering path to disagree with the first.
 */

import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { dirname, join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { open } from "./browser.ts";
import { settled, stand, walk, type Shot } from "./deck.ts";
import { host } from "./host.ts";

export type ExportOptions = {
  as: "pdf" | "png";
  /** A file for a pdf, a directory for images. */
  out: string;
  /** A page per reveal rather than a page per slide. */
  steps?: boolean;
  width?: number;
  height?: number;
  /** More pixels per point, for images meant to be looked at closely. */
  scale?: number;
  browserPath?: string;
};

export type Exported = { count: number; out: string; over: Shot[] };

/** `#themes.2` becomes `03-themes.2`, so a directory of them is in the order they were given. */
const named = (at: string, i: number, of: number) =>
  `${String(i + 1).padStart(String(of).length, "0")}-${at.replace(/^#/, "") || "start"}`;

export async function exportDeck(
  dir: string,
  opts: ExportOptions,
  say: (line: string) => void = console.error,
): Promise<Exported> {
  const { as, out, width = 1920, height = 1080, scale = 1 } = opts;

  const server = host(dir);
  server.listen(0);
  await once(server, "listening");
  const port = (server.address() as AddressInfo).port;

  const browser = await open(opts.browserPath, say);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: scale });
    // The deck is designed for a screen and sizes itself against the viewport. Printing it as
    // print media would have it lay itself out against the paper instead.
    await page.emulateMediaType("screen");
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle0" });

    const stops = await walk(page);
    const wanted = opts.steps ? stops : settled(stops);
    const over: Shot[] = [];
    const sheets: Uint8Array[] = [];

    for (const [i, at] of wanted.entries()) {
      const shot = await stand(page, at);
      if (shot.over) over.push(shot);

      if (as === "png") {
        const file = join(out, `${named(shot.at, i, wanted.length)}.png`);
        await mkdir(dirname(file), { recursive: true });
        await page.screenshot({ path: file });
      } else {
        // One page at a time, so each slide is exactly one sheet whatever its content does.
        sheets.push(
          await page.pdf({
            width: `${width}px`,
            height: `${height}px`,
            printBackground: true,
            pageRanges: "1",
          }),
        );
      }
    }

    if (as === "pdf") {
      const doc = await PDFDocument.create();
      for (const sheet of sheets) {
        const [page] = await doc.copyPages(await PDFDocument.load(sheet), [0]);
        doc.addPage(page!);
      }
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, await doc.save());
    }

    return { count: wanted.length, out, over };
  } finally {
    await browser.close();
    server.close();
  }
}
