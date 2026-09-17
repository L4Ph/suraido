/**
 * A value that outlives a slide.
 *
 * Only one slide is mounted at a time, so whatever a slide keeps in its own state is gone the
 * moment you move on. An atom lives outside that: declare it at module scope and any slide can
 * read it, write it, and be redrawn when it changes.
 */
export type Atom<T> = {
  get(): T;
  set(next: T): void;
  update(change: (current: T) => T): void;
  /** Returns the function that undoes the subscription. */
  subscribe(run: () => void): () => void;
};

export function atom<T>(initial: T): Atom<T> {
  let value = initial;
  const watchers = new Set<() => void>();

  return {
    get: () => value,

    set(next) {
      // Writing the same value is not a change, and redrawing for it is wasted work.
      if (Object.is(next, value)) return;
      value = next;
      // Iterating a Set is already safe against deletion, but not against growth: a watcher
      // that subscribes another one mid-notification would see it run in the same pass.
      // Notify the set as it stood when the write happened.
      // oxlint-disable-next-line no-useless-spread -- the copy is the point
      for (const run of [...watchers]) run();
    },

    update(change) {
      this.set(change(value));
    },

    subscribe(run) {
      watchers.add(run);
      return () => {
        watchers.delete(run);
      };
    },
  };
}
