# interactive

A live tally, an rAF animation driven by `mounted()` / `unmounted()`, a text field, and the
result of the tally read back several slides later — the things a Markdown deck cannot do.

The text field shows the one real cost of rebuilding on `setState`, and how `updated()` pays
it back. The tally shows what an `atom` is for: the votes are cast on the first slide, which
unmounts as soon as you leave it, and they are still there at the end.

```
vp dev
```
