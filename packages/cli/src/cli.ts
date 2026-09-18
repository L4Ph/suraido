#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { DOCS } from "./docs.ts";
import { exportDeck } from "./export.ts";

const HELP = `suraido — tools for a deck

  suraido export [dir]   a built deck as a PDF, images, or PowerPoint
                         dir defaults to ./dist

    --pdf                one page per slide, fully revealed (the default)
    --png                one image per slide
    --pptx               a PowerPoint file: one picture per slide, edge to edge
    --out <path>         a file, or a directory for --png
    --steps              a page per reveal rather than a page per slide
    --scale <n>          pixels per point, for --png (default 1)
    --browser-path <p>   a browser to render with, instead of looking for one
    --json               print the result as one line of JSON

  suraido docs           what the deck does, for whoever is writing one
  suraido docs <name>    one of them in full

  suraido --help, --version

For agents: run \`suraido docs\` first — it ships with the version installed, so it
describes the deck you actually have. export drives a browser and takes a few
seconds; it exits on its own.
`;

const version = async () =>
  JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).version;

function fail(message: string): never {
  console.error(`suraido: ${message}\n`);
  console.error(HELP);
  process.exit(1);
}

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      "browser-path": { type: "string" },
      help: { type: "boolean", short: "h" },
      json: { type: "boolean" },
      out: { type: "string" },
      pdf: { type: "boolean" },
      png: { type: "boolean" },
      pptx: { type: "boolean" },
      scale: { type: "string" },
      steps: { type: "boolean" },
      version: { type: "boolean", short: "v" },
    },
  });
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

const { values, positionals } = parsed;

if (values.version) {
  console.log(await version());
  process.exit(0);
}
if (values.help || positionals.length === 0) {
  console.log(HELP);
  process.exit(values.help ? 0 : 1);
}

const [command = "", arg] = positionals;

if (command === "docs") {
  if (!arg) {
    const list = Object.entries(DOCS).map(([name, d]) => ({
      name,
      description: d.description,
      show: `suraido docs ${name}`,
    }));
    console.log(values.json ? JSON.stringify(list) : list.map(formatted).join("\n"));
    process.exit(0);
  }
  const doc = DOCS[arg];
  if (!doc) fail(`no docs called "${arg}". There are: ${Object.keys(DOCS).join(", ")}`);
  console.log(values.json ? JSON.stringify({ name: arg, ...doc }) : doc.body);
  process.exit(0);
}

function formatted({ name, description }: { name: string; description: string }) {
  return `  ${name.padEnd(10)} ${description}`;
}

if (command !== "export") fail(`no command "${command}"`);

if ([values.pdf, values.png, values.pptx].filter(Boolean).length > 1)
  fail("pick one of --pdf, --png and --pptx");
const as = values.png ? "png" : values.pptx ? "pptx" : "pdf";
const scale = Number(values.scale ?? 1);
if (!Number.isFinite(scale) || scale <= 0) fail(`"${values.scale}" is not a scale`);

const dir = arg ?? "dist";
const out = values.out ?? { png: "slides", pptx: "deck.pptx", pdf: "deck.pdf" }[as];

try {
  const done = await exportDeck(dir, {
    as,
    out,
    scale,
    steps: values.steps,
    browserPath: values["browser-path"],
  });

  if (values.json) {
    console.log(JSON.stringify(done));
  } else {
    const what = { pdf: "pages", png: "images", pptx: "slides" }[as];
    console.log(`suraido: ${done.count} ${what} → ${done.out}`);
    for (const { at, over } of done.over) {
      // Nothing on screen shows this, so saying it here is the only chance anyone gets.
      console.error(
        `  ${at} runs ${over!.down > 0 ? `${over!.down}px past the bottom` : `${over!.across}px past the right`} of the canvas, and that part is cut off`,
      );
    }
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}
