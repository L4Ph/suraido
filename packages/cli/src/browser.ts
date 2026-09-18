/**
 * Finding a browser to render with.
 *
 * Rendering a deck to paper means laying out its fonts and its CSS, and the only thing that
 * does that correctly is a browser. Chrome is usually already on the machine; when it is not,
 * one is fetched rather than leaving you to go and install it.
 */

import { install, resolveBuildId, detectBrowserPlatform, Browser } from "@puppeteer/browsers";
import { homedir } from "node:os";
import { join } from "node:path";
import { launch, type Browser as Running, type ChromeReleaseChannel } from "puppeteer-core";

const CACHE = join(homedir(), ".cache", "suraido");

export async function open(executablePath?: string, say = console.error): Promise<Running> {
  if (executablePath) return launch({ executablePath, args: ["--no-sandbox"] });

  // Whatever Chrome is already installed, which is nearly always the right answer.
  const channels: ChromeReleaseChannel[] = ["chrome", "chrome-beta", "chrome-dev"];
  for (const channel of channels) {
    try {
      return await launch({ channel, args: ["--no-sandbox"] });
    } catch {
      // Try the next one; if none of them are here, fall through and fetch one.
    }
  }

  const platform = detectBrowserPlatform();
  if (!platform) throw new Error("suraido: no browser, and no build of one for this platform.");

  const buildId = await resolveBuildId(Browser.CHROME, platform, "stable");
  say(`suraido: no Chrome found. Fetching one into ${CACHE} (once).`);
  const got = await install({ browser: Browser.CHROME, buildId, cacheDir: CACHE });
  return launch({ executablePath: got.executablePath, args: ["--no-sandbox"] });
}
