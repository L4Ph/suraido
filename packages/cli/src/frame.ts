/**
 * The part of RFC 6455 a relay needs: read text frames off a socket, write them back out.
 *
 * This exists so the relay has no dependencies. `ws` is the obvious answer and a good library,
 * but a package whose whole job is to pass a short string between browsers should not make
 * anyone install a WebSocket implementation to run it.
 */

import { Buffer } from "node:buffer";

export type Frame = { opcode: number; payload: Buffer };

export const OP = { text: 0x1, close: 0x8, ping: 0x9, pong: 0xa } as const;

/**
 * Pulls whole frames out of a buffer that TCP is free to have cut anywhere — mid-header,
 * mid-payload, or several frames to a chunk. Whatever is left over is handed back to be
 * prepended to the next chunk.
 *
 * ponytail: no reassembly of fragmented messages (FIN = 0). Browsers do not fragment a string
 * this short, and the alternative is a per-socket accumulator. If a peer ever does, add one.
 */
export function decode(buf: Buffer): { frames: Frame[]; rest: Buffer } {
  const frames: Frame[] = [];
  let at = 0;

  while (at + 2 <= buf.length) {
    const opcode = buf[at]! & 0x0f;
    const masked = (buf[at + 1]! & 0x80) !== 0;
    let len = buf[at + 1]! & 0x7f;
    let head = at + 2;

    // 126 and 127 are not lengths. They say where the length actually is.
    if (len === 126) {
      if (head + 2 > buf.length) break;
      len = buf.readUInt16BE(head);
      head += 2;
    } else if (len === 127) {
      if (head + 8 > buf.length) break;
      // A Buffer cannot reach 2^53 bytes, so the top half is always zero here.
      len = Number(buf.readBigUInt64BE(head));
      head += 8;
    }

    const key = head;
    if (masked) head += 4;
    // The rest of this frame is still on the wire. Leave it whole for the next chunk.
    if (head + len > buf.length) break;

    const payload = Buffer.from(buf.subarray(head, head + len));
    // Everything a client sends is masked, and the mask is the only thing between us and
    // the text. Copy first (above), then unmask, so `rest` is never written through.
    if (masked) for (let i = 0; i < len; i++) payload[i]! ^= buf[key + (i % 4)]!;

    frames.push({ opcode, payload });
    at = head + len;
  }

  return { frames, rest: buf.subarray(at) };
}

/** One unfragmented frame. A server never masks. */
export function encode(payload: Buffer, opcode: number = OP.text): Buffer {
  const n = payload.length;
  let head: Buffer;

  if (n < 126) {
    head = Buffer.from([0x80 | opcode, n]);
  } else if (n < 65536) {
    head = Buffer.alloc(4);
    head[0] = 0x80 | opcode;
    head[1] = 126;
    head.writeUInt16BE(n, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x80 | opcode;
    head[1] = 127;
    head.writeBigUInt64BE(BigInt(n), 2);
  }

  return Buffer.concat([head, payload]);
}
