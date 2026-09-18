# @suraido/presenter

A second window with your notes, for [suraido.js](../suraido).

What you wrote in `static notes`, the slide after this one, and a clock — while the deck itself
stays on the projector, unchanged.

```sh
npm i @suraido/presenter
```

```tsx
import { deck, Slide } from "suraido.js";
import { presenter } from "@suraido/presenter";

class Intro extends Slide {
  static notes = "Thank the organisers. Mention the wifi password.";
}

deck([Intro], { use: [presenter()] });
```

Press <kbd>p</kbd> during the talk. Arrow keys work in either window and both stay together;
<kbd>r</kbd> restarts the clock.

| Option    |             |                                                          |
| --------- | ----------- | -------------------------------------------------------- |
| `key`     | `"p"`       | What opens the window                                    |
| `channel` | `"suraido"` | Name it to run more than one deck in one browser at once |

The two windows talk over a `BroadcastChannel`, which reaches **same-origin windows in the same
browser** — your laptop and the projector it drives, not the audience's phones. Pop-up blocking
stops the window opening; the console says so rather than the key doing nothing.

It is a [plugin](../suraido/README.md#attaching-things), so the deck hands it the same context
anything else in `use` gets, and `deck()` tears it down with everything else.

## Licence

MIT
