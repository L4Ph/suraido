import { Buffer } from "node:buffer";
import { expect, test } from "vite-plus/test";
import { decode, encode, OP } from "./frame.ts";

/** What a browser puts on the wire: the same frame, masked, as a client must. */
function masked(text: string): Buffer {
  const body = Buffer.from(text);
  const key = Buffer.from([0x37, 0xfa, 0x21, 0x3d]);
  const out = encode(body);
  // Turn the server frame we just built into a client one: set the mask bit, splice the key
  // in after the length, and mask the payload.
  const at = out.length - body.length;
  const head = out.subarray(0, at);
  head[1]! |= 0x80;
  const payload = Buffer.from(body.map((b, i) => b ^ key[i % 4]!));
  return Buffer.concat([head, key, payload]);
}

const read = (buf: Buffer) => decode(buf).frames.map((f) => f.payload.toString());

test("a frame arrives whole even when TCP cut it in half", () => {
  const whole = masked("#intro.1");
  const first = decode(whole.subarray(0, 5));

  expect(first.frames).toEqual([]);
  expect(read(Buffer.concat([first.rest, whole.subarray(5)]))).toEqual(["#intro.1"]);
});

test("two frames in one chunk are both read", () => {
  expect(read(Buffer.concat([masked("#a"), masked("#b")]))).toEqual(["#a", "#b"]);
});

test("a payload is masked on the way in and not on the way out", () => {
  const client = masked("#intro.1");
  // The proof it was really masked: the text is not sitting in the frame in the clear.
  expect(client.toString()).not.toContain("#intro.1");
  expect(read(client)).toEqual(["#intro.1"]);
  expect(encode(Buffer.from("#intro.1")).toString()).toContain("#intro.1");
});

// 126 and 127 are not lengths but escapes to a wider field, so a payload either side of each
// is read by different code. This is where a hand-written codec goes wrong.
test.each([125, 126, 127, 65535, 65536, 65537])(
  "a %i-byte payload survives the round trip",
  (n) => {
    const text = "x".repeat(n);
    expect(read(masked(text))).toEqual([text]);
    expect(read(encode(Buffer.from(text)))).toEqual([text]);
  },
);

test("a close and a ping are told apart from something to pass on", () => {
  const codes = decode(
    Buffer.concat([encode(Buffer.from(""), OP.close), encode(Buffer.from("hi"), OP.ping)]),
  ).frames.map((f) => f.opcode);
  expect(codes).toEqual([OP.close, OP.ping]);
});
