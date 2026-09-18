/**
 * A minimal JSX runtime: vnodes into DOM, and class components that hold state.
 * There is no diffing. setState rebuilds that subtree outright.
 */

export type VNode = { type: unknown; props: Record<string, any>; key: unknown };
export type Child = VNode | string | number | null | undefined | boolean | Child[];

export const Fragment = Symbol.for("jsx.fragment");
const SVG = "http://www.w3.org/2000/svg";

/** What was built, and which component built it. */
type Inst = { dom?: Node; comp?: Component<any, any>; kids: Inst[] };

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
    const inst: Inst = { comp, kids: [] };
    comp.$inst = inst;
    comp.$ns = ns;
    inst.kids = [mount(one(comp.render()), ns)];
    queueMicrotask(() => comp.$dead || comp.mounted());
    return inst;
  }
  if (typeof type === "function") {
    const inst: Inst = { kids: [] };
    inst.kids = [mount(one((type as (p: any) => Child)(props)), ns)];
    return inst;
  }

  const childNs = type === "svg" ? SVG : ns;
  const el = childNs
    ? document.createElementNS(childNs, type as string)
    : document.createElement(type as string);
  const inst: Inst = { dom: el, kids: [] };
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

const dirty = new Set<Component<any, any>>();

function flush() {
  const pending = [...dirty];
  dirty.clear();
  for (const c of pending) {
    if (c.$dead) continue;
    // Nothing is diffed: rebuild this subtree and swap it in.
    const prev = c.$inst.kids[0];
    // Put back whatever scope this subtree was first built in. A rebuild does not pass through
    // whoever set that up the first time, so without this it inherits the last one used.
    c.$enter?.();
    const fresh = mount(one(c.render()), c.$ns);
    const gone = domOf(prev);
    gone.parentNode!.replaceChild(domOf(fresh), gone);
    unmount(prev);
    c.$inst.kids = [fresh];
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
