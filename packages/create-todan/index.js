#!/usr/bin/env node
import { existsSync } from "node:fs";
import { cp, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(await readFile(join(HERE, "package.json"), "utf8"));

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  create-todan — start a deck

    npm create todan@latest [directory] [--name <name>]

  directory    where to put it (default: my-deck)
  --name       the package name (default: taken from the directory)
`);
  process.exit(0);
}

const nameFlag = args.indexOf("--name");
const explicitName = nameFlag === -1 ? null : args[nameFlag + 1];
const valueOfFlag = nameFlag === -1 ? -1 : nameFlag + 1;
const positional = args.filter((a, i) => !a.startsWith("-") && i !== valueOfFlag);

const target = resolve(positional[0] ?? "my-deck");
const dir = basename(target);

/** npm names are lowercase and have no spaces, but directories are not. */
const toPackageName = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+/, "")
    .replace(/-+$/, "") || "deck";

const name = toPackageName(explicitName ?? dir);

if (explicitName && !explicitName.trim()) {
  console.error("--name needs a value.");
  process.exit(1);
}

if (existsSync(target) && (await readdir(target)).length > 0) {
  console.error(`${target} is not empty. Pick another directory.`);
  process.exit(1);
}

// In the repository the template doubles as a deck you can run, so leave its build output behind.
const SKIP = new Set(["node_modules", "dist", ".vite", ".DS_Store"]);
await cp(join(HERE, "template"), target, {
  recursive: true,
  filter: (src) => !SKIP.has(basename(src)),
});

// npm reads a published .gitignore as .npmignore and drops the files, so the template
// carries it as _gitignore and it is put back here.
const dotless = join(target, "_gitignore");
if (existsSync(dotless)) await rename(dotless, join(target, ".gitignore"));

// Inside the template this is a workspace reference; a created project points at the release.
const pkgPath = join(target, "package.json");
const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
pkg.name = name;
pkg.dependencies.todan = `^${version}`;
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const cdArg = /[^\w.@/-]/.test(dir) ? JSON.stringify(dir) : dir;

console.log(`
  Created ${name} in ${dir}/

    cd ${cdArg}
    npm install
    npm run dev
`);
