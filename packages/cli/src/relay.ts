/**
 * Passes one short string — where the deck is — between every browser watching the talk.
 *
 * It knows nothing about slides. A browser says the position it moved to, the others are told,
 * and the last one is kept so that someone opening the link halfway through lands where the
 * talk is. That is the whole thing.
 *
 * It rides on the same server that serves the deck, which is the point: the browser reaches it
 * at its own origin, so there is no address to configure and none to get wrong.
 */

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import type { Server } from "node:http";
import type { Socket } from "node:net";
import { decode, encode, OP } from "./frame.ts";

/** The constant RFC 6455 has the handshake hashed against. */
const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

export const ENDPOINT = "/__suraido";

/** Wires the talk onto a server that is already serving the deck. */
export function relay(server: Server, endpoint: string = ENDPOINT): void {
  const watching = new Set<Socket>();
  let last: string | undefined;

  server.on("upgrade", (req, socket: Socket) => {
    const key = req.headers["sec-websocket-key"];
    const [path = "/", query = ""] = (req.url ?? "/").split("?");
    if (!key || path !== endpoint) return socket.destroy();

    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        `Sec-WebSocket-Accept: ${createHash("sha1")
          .update(key + GUID)
          .digest("base64")}\r\n\r\n`,
    );
    socket.setNoDelay(true);
    watching.add(socket);

    // Catch a latecomer up — but never the presenter. Their own deck is the authority, and
    // being dragged back to a stale position on a reconnect is the one thing they would notice.
    if (last !== undefined && !new URLSearchParams(query).has("drive")) {
      socket.write(encode(Buffer.from(last)));
    }

    // subarray() hands back a view over whatever buffer it came from, which is not the same
    // Buffer type as a freshly allocated one.
    let rest: Buffer<ArrayBufferLike> = Buffer.alloc(0);

    socket.on("data", (chunk) => {
      const read = decode(Buffer.concat([rest, chunk]));
      rest = read.rest;

      for (const frame of read.frames) {
        if (frame.opcode === OP.close) return socket.destroy();
        if (frame.opcode === OP.ping) {
          socket.write(encode(frame.payload, OP.pong));
          continue;
        }
        if (frame.opcode !== OP.text) continue;

        last = frame.payload.toString();
        const out = encode(frame.payload);
        for (const peer of watching) if (peer !== socket) peer.write(out);
      }
    });

    const drop = () => watching.delete(socket);
    socket.on("close", drop);
    socket.on("error", drop);
  });
}
