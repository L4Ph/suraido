/**
 * 最小の JSX ランタイム: vnode → DOM の生成と、状態を持つクラスコンポーネント。
 * 差分適用(VDOM)は持たない。setState はその部分木を丸ごと作り直す。
 */

export type VNode = { type: unknown; props: Record<string, any>; key: unknown }
export type Child = VNode | string | number | null | undefined | boolean | Child[]

export const Fragment = Symbol.for('jsx.fragment')
const SVG = 'http://www.w3.org/2000/svg'

/** 生成した DOM と、それを作ったコンポーネントの対応。 */
type Inst = { dom?: Node; comp?: Component<any, any>; kids: Inst[] }

const domOf = (i: Inst): Node => i.dom ?? domOf(i.kids[0])

/**
 * 子を1段のリストに潰す。falsy な子は空テキストとして残すので、
 * `{cond && <p/>}` が消えても後ろの兄弟の添字がずれない。
 */
function flatten(c: Child, out: (VNode | string)[] = []): (VNode | string)[] {
  if (Array.isArray(c)) {
    for (const x of c) flatten(x, out)
  } else if (c == null || typeof c === 'boolean') {
    out.push('')
  } else if (typeof c === 'object') {
    c.type === Fragment ? flatten(c.props.children, out) : out.push(c)
  } else {
    out.push(String(c))
  }
  return out
}

/** コンポーネントの戻り値は単一ルートとして扱う。 */
const one = (c: Child) => flatten(c)[0] ?? ''

/*
 * instanceof Component で見ると、todan が二重に読み込まれた時（依存ツリーに複数版が
 * 入るなど）に別クラス扱いになって壊れる。prototype.render の有無で見れば影響を受けない。
 * 関数コンポーネントは prototype.render を持たないので取り違えない。
 */
const isClass = (t: unknown): t is new (p: any) => Component<any, any> =>
  typeof t === 'function' && typeof (t as any).prototype?.render === 'function'

function mount(v: VNode | string, ns: string | null): Inst {
  if (typeof v === 'string') return { dom: document.createTextNode(v), kids: [] }

  const { type, props } = v
  if (isClass(type)) {
    const comp = new type(props)
    const inst: Inst = { comp, kids: [] }
    comp.$inst = inst
    comp.$ns = ns
    inst.kids = [mount(one(comp.render()), ns)]
    queueMicrotask(() => comp.$dead || comp.mounted())
    return inst
  }
  if (typeof type === 'function') {
    const inst: Inst = { kids: [] }
    inst.kids = [mount(one((type as (p: any) => Child)(props)), ns)]
    return inst
  }

  const childNs = type === 'svg' ? SVG : ns
  const el = childNs ? document.createElementNS(childNs, type as string) : document.createElement(type as string)
  const inst: Inst = { dom: el, kids: [] }
  applyProps(el, props)
  for (const c of flatten(props.children)) {
    const k = mount(c, childNs)
    el.appendChild(domOf(k))
    inst.kids.push(k)
  }
  return inst
}

function unmount(inst: Inst) {
  if (inst.comp) {
    inst.comp.$dead = true
    inst.comp.unmounted()
  }
  for (const k of inst.kids) unmount(k)
}

function applyProps(el: Element, props: Record<string, any>) {
  for (const k in props) if (k !== 'children') setProp(el, k, props[k])
}

/** props は DOM の属性にそのまま流す。on* だけ addEventListener に回す。 */
function setProp(el: any, k: string, v: unknown) {
  if (k.startsWith('on')) {
    if (v) el.addEventListener(k.slice(2).toLowerCase(), v)
  } else if (k === 'style') {
    el.style.cssText = ''
    if (v && typeof v === 'object') Object.assign(el.style, v)
    else if (v) el.style.cssText = String(v)
  } else if (k === 'value' || k === 'checked') {
    el[k] = v ?? ''
  } else if (v == null || v === false) {
    el.removeAttribute(k)
  } else {
    el.setAttribute(k, v === true ? '' : String(v))
  }
}

const dirty = new Set<Component<any, any>>()

function flush() {
  const pending = [...dirty]
  dirty.clear()
  for (const c of pending) {
    if (c.$dead) continue
    // 差分は取らない。この部分木を作り直して差し替える。
    const prev = c.$inst.kids[0]
    const fresh = mount(one(c.render()), c.$ns)
    const gone = domOf(prev)
    gone.parentNode!.replaceChild(domOf(fresh), gone)
    unmount(prev)
    c.$inst.kids = [fresh]
    c.updated()
  }
}

export abstract class Component<P = {}, S = {}> {
  props: P
  state: S = {} as S
  /** @internal */ $inst!: Inst
  /** @internal */ $ns: string | null = null
  /** @internal */ $dead = false

  constructor(props: P) {
    this.props = props
  }

  setState(patch: Partial<S> | ((s: S) => Partial<S>)) {
    this.state = { ...this.state, ...(typeof patch === 'function' ? patch(this.state) : patch) }
    if (dirty.size === 0) queueMicrotask(flush)
    dirty.add(this)
  }

  mounted() {}
  /**
   * 再描画で DOM を作り直した直後に呼ばれる。
   * フォーカスやスクロール位置など、DOM 側にしか無い状態を戻すための場所。
   */
  updated() {}
  unmounted() {}
  abstract render(): Child
}

/**
 * 保留中の再レンダリングを同期で流す。
 * View Transition のように「DOM 変更を今この場で終わらせろ」と要求される所で使う。
 */
export function flushSync() {
  flush()
}

export function render(v: Child, container: Element) {
  const inst = mount(one(v), null)
  container.replaceChildren(domOf(inst))
  return inst
}
