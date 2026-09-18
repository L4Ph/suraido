# @suraido/atom

State that outlives a slide, for [suraido.js](../suraido).

Only one slide is mounted at a time, so whatever a slide keeps in `setState` is gone the moment
you move on. An atom lives outside that.

```sh
npm i @suraido/atom
```

```tsx
import { atom } from "@suraido/atom";
import { Slide } from "suraido.js";

const votes = atom([0, 0, 0]); // module scope, outside every slide

class Poll extends Slide {
  mounted() {
    this.watch(votes);
  }
  cast(i: number) {
    votes.update((counts) => counts.map((n, j) => (j === i ? n + 1 : n)));
  }
  render() {
    /* votes.get() */
  }
}

class Results extends Slide {
  // several slides later
  mounted() {
    this.watch(votes);
  } // same atom, nothing passed along
}
```

`watch` is in the core, not here: it redraws the component on every change and drops the
subscription when the component leaves, so a slide you have moved on from stops being redrawn
and the atom stops holding on to it. It asks for nothing but `subscribe(fn)` returning an
unsubscribe, so this package is one way to satisfy it rather than the only one.

## API

|                    |                                                                     |
| ------------------ | ------------------------------------------------------------------- |
| `atom<T>(initial)` | A new atom holding `initial`                                        |
| `.get()`           | The current value                                                   |
| `.set(next)`       | Write. A value `Object.is`-equal to the current one notifies nobody |
| `.update(fn)`      | `set(fn(get()))`                                                    |
| `.subscribe(fn)`   | Returns the function that undoes it                                 |

Nothing is persisted and nothing crosses windows — an atom is one tab's memory. It has no
dependencies, including on `suraido.js` itself.

## Licence

MIT
