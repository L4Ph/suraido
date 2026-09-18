# @suraido/cli

Tools for a deck built with [suraido.js](../suraido).

```sh
npx @suraido/cli serve dist/
```

```
  suraido  serving dist/

  audience   http://192.168.50.66:4477/
  you        http://localhost:4477/?drive

  Runs until stopped.
```

Share the first address with the room and open the second yourself. Everyone follows you —
including the phones. **Your deck imports nothing**: `serve` puts the sync into the page as it
serves it.

|              |                                                         |
| ------------ | ------------------------------------------------------- |
| `--port <n>` | default `4477`                                          |
| `--json`     | one line of JSON with the addresses, then keeps serving |

## How it stays in sync

One string travels: the deck's own URL hash — `#themes.2`. It is **absolute**, so a phone that
missed a move, joined late, or had its screen off for three slides lands exactly where the talk
is. "Forward one" cannot say that: two decks that disagree about where they are never meet
again.

That is also all the injected script knows. It watches the URL and nothing else — no import, no
plugin, no contract with the framework, and no client library whose version could drift from
the server's. Anything that puts its position in the URL would work.

- Someone opening the link halfway through is told the current position on connect
- Whoever is driving is **not** told — their own deck is the authority, and being dragged back
  after a wifi blip is the one thing a presenter would notice
- Someone in the audience can look ahead on their own phone; it does not move anyone else
- Nothing is cached, because a stale deck on the projector is the worst thing this could serve

There is no auth. Anyone who can reach the port can drive the room with `?drive`, so run it on
the network you are presenting on, not on the internet.

## The relay

~70 lines of `node:http` and `node:crypto`, with **no dependencies** — not even `ws`. A server
whose whole job is to pass a short string between browsers should not make you install a
WebSocket implementation to run it. It speaks enough of RFC 6455 to be talked to by a real
browser, which is what [its tests do](src/relay.test.ts): a real server on a real port, real
`WebSocket`s, no stand-ins.

It is importable too, if you would rather put it on a server you already have:

```ts
import { serve } from "@suraido/cli/serve";
serve("dist", 4477);
```

## For agents

`serve` does not exit — it runs until it is stopped. Start it in the background rather than
waiting on it, and read the addresses from `--json`.

## Licence

MIT
