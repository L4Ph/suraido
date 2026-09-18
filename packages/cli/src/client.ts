import { ENDPOINT } from "./relay.ts";

/**
 * What `suraido serve` puts into the page.
 *
 * It knows nothing about the framework. A deck writes where it is into the URL, so this watches
 * the URL and nothing else: no import in the deck, nothing to attach, no contract between the
 * two, and no version of a client library to keep in step with the server serving it.
 *
 * It reaches the relay at its own origin, so there is no address to configure — and none to get
 * wrong on someone else's wifi.
 */
export const CLIENT = `<script>
(() => {
  const drive = new URLSearchParams(location.search).has("drive");
  const at = () => location.hash;
  let known = at();
  let wire;

  // A deck reads the URL when it starts and writes back what it decided. This script is in the
  // page before the deck's own module runs, and on the same origin the relay answers fast
  // enough to win that race — so a position applied too early is simply overwritten, and the
  // latecomer is stranded on slide one for the rest of the talk. Wait until the page is up.
  // ponytail: a deck mounted later still than load would need telling. None of ours are.
  const started =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((done) => addEventListener("load", done, { once: true }));

  const connect = () => {
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    wire = new WebSocket(scheme + "://" + location.host + ${JSON.stringify(ENDPOINT)} + (drive ? "?drive" : ""));

    wire.addEventListener("message", async (e) => {
      known = e.data;
      await started;
      // The deck is listening for this. Nothing else is needed to move it.
      if (location.hash !== e.data) location.hash = e.data;
    });
    wire.addEventListener("open", () => {
      // Correct the room rather than being corrected by it.
      if (drive) wire.send((known = at()));
    });
    wire.addEventListener("close", () => setTimeout(connect, 1000));
  };
  connect();

  // A deck moves with replaceState, which fires no event. Watching the URL is the only way in
  // that does not ask the deck to know this exists.
  if (drive)
    setInterval(() => {
      if (at() === known) return;
      known = at();
      if (wire.readyState === 1) wire.send(known);
    }, 100);
})();
</script>`;
