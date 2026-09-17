#!/usr/bin/env node
import { existsSync } from "node:fs";
import { cp, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { DEFAULT_DIR, DEFAULT_THEME, THEMES } from "./themes.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(await readFile(join(HERE, "..", "package.json"), "utf8")) as {
  version: string;
};

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  create-suraido — start a deck

    npm create suraido@latest [directory] [--name <name>] [--theme <theme>]

  directory    where to put it (default: ${DEFAULT_DIR})
  --name       the package name (default: taken from the directory)
  --theme      ${THEMES.join(", ")} (default: ${DEFAULT_THEME})

  Anything you leave out is asked for, unless there is no terminal to ask on.
`);
  process.exit(0);
}

const flags: Record<string, string | undefined> = {};
const positional: string[] = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg.startsWith("--")) flags[arg.slice(2)] = args[++i];
  else positional.push(arg);
}

let rl: ReturnType<typeof createInterface> | undefined;

/**
 * Asks, but only when someone is there to answer. Piped or in CI stdin is not a TTY, so the
 * default is taken rather than hanging on a prompt nobody will see.
 *
 * One interface serves every question; reopening one over process.stdin does not survive the
 * close. Ctrl+C and Ctrl+D reject, and leaving that unhandled prints a stack trace at someone
 * who only meant to back out.
 */
async function ask(question: string, fallback: string): Promise<string> {
  if (!process.stdin.isTTY) return fallback;
  rl ??= createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`  ${question} (${fallback}) `);
    return answer.trim() || fallback;
  } catch {
    console.log("\n  Cancelled.");
    process.exit(130);
  }
}

const dirInput = positional[0] ?? (await ask("Where should it go?", DEFAULT_DIR));
const target = resolve(dirInput);
const dir = basename(target);

if (existsSync(target) && (await readdir(target)).length > 0) {
  console.error(`${target} is not empty. Pick another directory.`);
  process.exit(1);
}

const theme = flags.theme ?? (await ask(`Theme? ${THEMES.join(" / ")}`, DEFAULT_THEME));
if (!THEMES.includes(theme as (typeof THEMES)[number])) {
  console.error(`No theme called "${theme}". Pick one of: ${THEMES.join(", ")}`);
  process.exit(1);
}

/** npm names are lowercase and have no spaces, but directories are not. */
function toPackageName(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^[._-]+/, "")
      .replace(/-+$/, "") || "deck"
  );
}

const name = toPackageName(flags.name ?? dir);

// In the repository the template doubles as a deck you can run, so leave its output behind.
const SKIP = new Set(["node_modules", "dist", ".vite", ".DS_Store"]);
await cp(join(HERE, "..", "template"), target, {
  recursive: true,
  filter: (src) => !SKIP.has(basename(src)),
});

// npm reads a published .gitignore as .npmignore and drops the files, so the template
// carries it as _gitignore and it is put back here.
const dotless = join(target, "_gitignore");
if (existsSync(dotless)) await rename(dotless, join(target, ".gitignore"));

// Inside the template this is a workspace reference; a created project points at the release.
const pkgPath = join(target, "package.json");
const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as {
  name: string;
  dependencies: Record<string, string>;
};
pkg.name = name;
pkg.dependencies["suraido.js"] = `^${version}`;
await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

if (theme !== DEFAULT_THEME) {
  const entry = join(target, "src", "index.tsx");
  const src = await readFile(entry, "utf8");
  await writeFile(entry, src.replace(`themes/${DEFAULT_THEME}.css`, `themes/${theme}.css`));
}

// Close the prompt and let go of stdin: a resumed TTY handle keeps the loop alive, and a
// scaffolder that will not exit is worse than one that never asked. Only a TTY opened an
// interface, and only a TTY stdin is a socket — a redirected one has no unref at all.
if (rl) {
  rl.close();
  process.stdin.unref?.();
}

const cdArg = /[^\w.@/-]/.test(dir) ? JSON.stringify(dir) : dir;

console.log(`
  Created ${name} in ${dir}/ with the ${theme} theme

    cd ${cdArg}
    npm install
    npm run dev
`);
