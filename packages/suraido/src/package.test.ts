import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const manifest = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
) as { dependencies?: Record<string, string>; exports: Record<string, unknown> };

/**
 * Zero dependencies is the headline claim, and the reason the store and the presenter view
 * live in their own packages. Re-export one from here for convenience and the claim quietly
 * stops being true.
 */
test("installing the core brings nothing else with it", () => {
  expect(manifest.dependencies ?? {}).toEqual({});
});

test("the store is not part of the core", async () => {
  const core = await import("./index.ts");
  expect(Object.keys(core)).not.toContain("atom");
});
