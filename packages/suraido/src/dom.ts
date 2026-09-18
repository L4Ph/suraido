/**
 * A minimal JSX runtime: vnodes into DOM, and class components that hold state.
 *
 * A redraw re-runs render and puts the result onto the DOM that is already there, so an element
 * changes only when something about it changed. What the DOM alone holds — focus, what someone
 * has half typed, a video's position, a canvas — is not restored afterwards, because it was
 * never taken away.
 */

export type VNode = { type: unknown; props: Record<string, any>; key: unknown };
export type Child = VNode | string | number | null | undefined | boolean | Child[];

export const Fragment = Symbol.for("jsx.fragment");
const SVG = "http://www.w3.org/2000/svg";

/** What was built, which component built it, and what it was built from. */
type Inst = {
  dom?: Node;
  comp?: Component<any, any>;
  kids: Inst[];
  /** Compared on a redraw: a different type cannot be patched into the same node. */
  type?: unknown;
  /** The props a host element was last given, so the next lot can be compared against them. */
  was?: Record<string, any>;
};

const domOf = (i: Inst): Node => i.dom ?? domOf(i.kids[0]);

/**
 * Flattens children into one list. Falsy children stay as empty text, so when
 * `{cond && <p/>}` disappears the siblings after it keep their index.
 */
function flatten(c: Child, out: (VNode | string)[] = []): (VNode | string)[] {
  if (Array.isArray(c)) {
    for (const x of c) flatten(x, out);
  } else if (c == null || typeof c === "boolean") {
    out.push("");
  } else if (typeof c === "object") {
    if (c.type === Fragment) flatten(c.props.children, out);
    else out.push(c);
  } else {
    out.push(String(c));
  }
  return out;
}

/** A component's return value is treated as a single root. */
const one = (c: Child) => flatten(c)[0] ?? "";

/*
 * instanceof Component breaks when suraido.js is loaded twice — two copies in the dependency
 * tree make them different classes. Looking for prototype.render does not care.
 * A function component has no prototype.render, so nothing is mistaken for a class.
 */
const isClass = (t: unknown): t is new (p: any) => Component<any, any> =>
  typeof t === "function" && typeof (t as any).prototype?.render === "function";

function mount(v: VNode | string, ns: string | null): Inst {
  if (typeof v === "string") return { dom: document.createTextNode(v), kids: [] };

  const { type, props } = v;
  if (isClass(type)) {
    const comp = new type(props);
    const inst: Inst = { comp, kids: [], type };
    comp.$inst = inst;
    comp.$ns = ns;
    inst.kids = [mount(one(comp.render()), ns)];
    queueMicrotask(() => comp.$dead || comp.mounted());
    return inst;
  }
  if (typeof type === "function") {
    const inst: Inst = { kids: [], type };
    inst.kids = [mount(one((type as (p: any) => Child)(props)), ns)];
    return inst;
  }

  const childNs = type === "svg" ? SVG : ns;
  const el = childNs
    ? document.createElementNS(childNs, type as string)
    : document.createElement(type as string);
  const inst: Inst = { dom: el, kids: [], type, was: props };
  applyProps(el, props);
  for (const c of flatten(props.children)) {
    const k = mount(c, childNs);
    el.appendChild(domOf(k));
    inst.kids.push(k);
  }
  return inst;
}

function unmount(inst: Inst) {
  if (inst.comp) {
    inst.comp.$dead = true;
    for (const off of inst.comp.$unwatch) off();
    inst.comp.$unwatch.length = 0;
    inst.comp.unmounted();
  }
  for (const k of inst.kids) unmount(k);
}

function applyProps(el: Element, props: Record<string, any>) {
  for (const k in props) if (k !== "children") setProp(el, k, props[k]);
}

/** Props go straight to DOM attributes. Only on* is routed to addEventListener. */
function setProp(el: any, k: string, v: unknown) {
  if (k.startsWith("on")) {
    if (v) el.addEventListener(k.slice(2).toLowerCase(), v);
  } else if (k === "style") {
    el.style.cssText = "";
    if (v && typeof v === "object") Object.assign(el.style, v);
    else if (typeof v === "string") el.style.cssText = v;
  } else if (k === "value" || k === "checked") {
    el[k] = v ?? "";
  } else if (v === true) {
    el.setAttribute(k, "");
  } else if (typeof v === "string" || typeof v === "number") {
    el.setAttribute(k, String(v));
  } else {
    // null, false and anything else carry no meaning as an attribute.
    // Passing them through String() would write [object Object] into it.
    el.removeAttribute(k);
  }
}

/**
 * Puts a fresh render onto the DOM that is already there.
 *
 * Returns the instance to keep: the same one when it could be patched, a new one when the
 * shape changed and it had to be replaced.
 */
function patch(inst: Inst, v: VNode | string, ns: string | null): Inst {
  if (typeof v === "string") {
    // A text node keeps its identity; only its data moves.
    if (inst.dom instanceof Text) {
      if (inst.dom.data !== v) inst.dom.data = v;
      return inst;
    }
    return replace(inst, v, ns);
  }

  // Anything that is not the same kind of thing cannot be patched into place.
  if (v.type !== inst.type) return replace(inst, v, ns);

  const { type, props } = v;

  if (isClass(type)) {
    const comp = inst.comp!;
    comp.props = props;
    comp.$enter?.();
    inst.kids = [patch(inst.kids[0]!, one(comp.render()), comp.$ns)];
    comp.updated();
    return inst;
  }

  if (typeof type === "function") {
    inst.kids = [patch(inst.kids[0]!, one((type as (p: any) => Child)(props)), ns)];
    return inst;
  }

  const el = inst.dom as Element;
  const childNs = type === "svg" ? SVG : ns;
  patchProps(el, inst.was ?? {}, props);
  patchKids(inst, el, flatten(props.children), childNs);
  inst.was = props;
  return inst;
}

/** Building it again, for when the shape really did change. */
function replace(inst: Inst, v: VNode | string, ns: string | null): Inst {
  const fresh = mount(v, ns);
  const gone = domOf(inst);
  gone.parentNode!.replaceChild(domOf(fresh), gone);
  unmount(inst);
  return fresh;
}

/**
 * Same by identity, or — for a plain object like an inline style — same in what it says.
 *
 * `style={{ width: `${pct}%` }}` builds a new object every render. Judging it by identity
 * would rewrite it every time, and writing a style clears the whole of cssText first, which
 * takes anything else on the element with it and restarts a transition that was running.
 */
function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const [x, y] = [a as Record<string, unknown>, b as Record<string, unknown>];
  const keys = Object.keys(x);
  return keys.length === Object.keys(y).length && keys.every((k) => Object.is(x[k], y[k]));
}

/** Only what left, and only what says something different. */
function patchProps(el: Element, was: Record<string, any>, now: Record<string, any>) {
  const event = (k: string) => k.slice(2).toLowerCase();

  for (const k in was) {
    if (k === "children" || k in now) continue;
    if (k.startsWith("on")) el.removeEventListener(event(k), was[k]);
    else setProp(el, k, null);
  }

  for (const k in now) {
    // What has not changed is not written, and that is the point: `value` is left alone, so
    // what someone has typed since the last render is still there. A rebuild cannot say that.
    if (k === "children" || same(was[k], now[k])) continue;

    // A handler written inline is a different function every render, so the old one has to go
    // or they pile up and one click counts twice.
    if (k.startsWith("on") && was[k]) el.removeEventListener(event(k), was[k]);

    // A style that did change is moved across property by property, again so that nothing the
    // framework did not put there is swept away.
    if (k === "style" && isPlain(was[k]) && isPlain(now[k])) patchStyle(el, was[k], now[k]);
    else setProp(el, k, now[k]);
  }
}

const isPlain = (v: unknown) => !!v && typeof v === "object";

function patchStyle(el: Element, was: Record<string, any>, now: Record<string, any>) {
  const style = (el as HTMLElement).style as any;
  for (const k in was) if (!(k in now)) style[k] = "";
  for (const k in now) if (!Object.is(was[k], now[k])) style[k] = now[k];
}

/**
 * Children are matched by position. flatten() already keeps a vanished `{cond && <p/>}` as an
 * empty text node, so the siblings after it do not shift — which is what makes position enough.
 *
 * ponytail: no keys, so reordering a list rebuilds it. Move to keys if a deck ever reorders one.
 */
function patchKids(inst: Inst, el: Element, next: (VNode | string)[], ns: string | null) {
  const kids = inst.kids;

  for (const [i, v] of next.entries()) {
    if (i < kids.length) {
      kids[i] = patch(kids[i]!, v, ns);
    } else {
      const fresh = mount(v, ns);
      el.appendChild(domOf(fresh));
      kids.push(fresh);
    }
  }

  for (const gone of kids.splice(next.length)) {
    domOf(gone).parentNode?.removeChild(domOf(gone));
    unmount(gone);
  }
}

const dirty = new Set<Component<any, any>>();

function flush() {
  const pending = [...dirty];
  dirty.clear();
  for (const c of pending) {
    if (c.$dead) continue;
    // Put back whatever scope this subtree was first built in. A redraw does not pass through
    // whoever set that up the first time, so without this it inherits the last one used.
    c.$enter?.();
    c.$inst.kids = [patch(c.$inst.kids[0]!, one(c.render()), c.$ns)];
    c.updated();
  }
}

export abstract class Component<P = {}, S = {}> {
  props: P;
  state: S = {} as S;
  /** @internal */ $inst!: Inst;
  /** @internal The element this component built, for the rare job that needs to scope a query
   * to one component's own subtree rather than the whole document. Valid once mounted. */
  get $el(): Node {
    return domOf(this.$inst);
  }
  /** @internal */ $ns: string | null = null;
  /** @internal */ $dead = false;
  /** @internal */ $unwatch: (() => void)[] = [];
  /** @internal Runs just before this component's subtree is rebuilt. */
  $enter?: () => void;

  constructor(props: P) {
    this.props = props;
  }

  setState(patch: Partial<S> | ((s: S) => Partial<S>)) {
    this.state = { ...this.state, ...(typeof patch === "function" ? patch(this.state) : patch) };
    if (dirty.size === 0) queueMicrotask(flush);
    dirty.add(this);
  }

  /**
   * Redraw this component whenever one of these atoms changes.
   *
   * The subscriptions are dropped when the component leaves, so a slide you have moved on from
   * stops being redrawn — and the atom stops holding on to it.
   */
  watch(...atoms: { subscribe(run: () => void): () => void }[]) {
    for (const source of atoms) {
      this.$unwatch.push(source.subscribe(() => this.setState({} as Partial<S>)));
    }
  }

  mounted() {}
  /**
   * Runs right after a re-render has rebuilt the DOM.
   * The place to put back focus, scroll position and anything else the DOM alone held.
   */
  updated() {}
  unmounted() {}
  abstract render(): Child;
}

/**
 * Flushes pending re-renders synchronously.
 * For callers like View Transitions that demand the DOM change finish right here.
 */
export function flushSync() {
  flush();
}

export function render(v: Child, container: Element) {
  const inst = mount(one(v), null);
  container.replaceChildren(domOf(inst));
  return inst;
}
