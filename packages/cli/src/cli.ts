#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { parseArgs } from "node:util";
import { PORT, serve } from "./serve.ts";

const version = async () =>
  JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).version;

const HELP = `suraido — tools for a deck

  suraido serve [dir]   serve a built deck and keep every browser on the same slide
                        dir defaults to ./dist

    --port <n>          default ${PORT}
    --json              print one line of JSON with the addresses, then keep serving

  suraido --help, --version

For agents: serve does not exit — it runs until it is stopped. Start it in the
background rather than waiting on it, and use --json to read the addresses.
`;

/** A phone in the room cannot reach localhost, so print the address that it can. */
const lan = () =>
  Object.values(networkInterfaces())
    .flat()
    .find((n) => n?.family === "IPv4" && !n.internal)?.address ?? "localhost";

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
      help: { type: "boolean", short: "h" },
      json: { type: "boolean" },
      port: { type: "string" },
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
if (values.help) {
  console.log(HELP);
  process.exit(0);
}

const [command, dir = "dist"] = positionals;
if (!command) fail("no command given");
if (command !== "serve") fail(`no command "${command}"`);

const port = Number(values.port ?? PORT);
if (!Number.isInteger(port) || port < 0 || port > 65535) fail(`"${values.port}" is not a port`);

const server = serve(dir, port);
server.on("error", (e: NodeJS.ErrnoException) =>
  fail(
    e.code === "EADDRINUSE"
      ? `port ${port} is already taken. Pass --port <n> for another.`
      : e.message,
  ),
);

server.once("listening", () => {
  const audience = `http://${lan()}:${port}/`;
  const you = `http://localhost:${port}/?drive`;

  // One line, so whatever started this can read the addresses without parsing a banner. The
  // process stays up either way: serving is the job.
  if (values.json) console.log(JSON.stringify({ audience, you, port, dir }));
  else
    console.log(`
  suraido  serving ${dir}

  audience   ${audience}
  you        ${you}

  Runs until stopped.
`);
});
