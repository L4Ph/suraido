import { Component, flushSync, render, type Child } from './dom.ts'
import { advance, parseHash, formatHash, type Pos, type Paths } from './nav.ts'

/** スライドの基底クラス。状態はふつうにクラスに持たせる。 */
export abstract class Slide<P = {}, S = {}> extends Component<P, S> {
  /** このスライドが吸収するキー入力の回数。 */
  static steps = 1
  /** URL に出る名前。省略すると添字になる。 */
  static path?: string
}

export type SlideComponent = (new (props: {}) => Slide<any, any>) & { steps?: number; path?: string }

// ponytail: デッキは同時に1つという前提。複数並べるなら Deck インスタンスごとに持たせる。
let deckStep = 0

/**
 * 段階 n に到達するまで透明。場所は取り続けるのでレイアウトが動かない。
 * マウント時の状態だけ自前で決め、以降の切り替えは Deck が属性を叩く。
 *
 * 既定では div を作る。置き場所が div を許さない時（ul の中など）は `as` で
 * 要素名を変える。`<ul><Step n={1} as="li">…</Step></ul>` で ul > li になる。
 */
export function Step({
  n,
  as: Tag = 'div',
  class: cls,
  children,
  ...rest
}: {
  n: number
  as?: string
  class?: string
  children?: Child
  [attr: string]: unknown
}) {
  return (
    <Tag
      class={cls ? `step ${cls}` : 'step'}
      data-n={n}
      data-shown={n <= deckStep || null}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** 段階表示の切り替えは再レンダリングを挟まず属性だけ。CSS transition が生き残る。 */
function syncSteps(step: number) {
  deckStep = step
  for (const el of document.querySelectorAll<HTMLElement>('.step[data-n]')) {
    el.toggleAttribute('data-shown', Number(el.dataset.n) <= step)
  }
}

type DeckProps = { slides: SlideComponent[]; width?: number; height?: number }

export class Deck extends Component<DeckProps, { i: number }> {
  paths: Paths = this.props.slides.map((s) => s.path)
  steps = (i: number) => this.props.slides[i]?.steps ?? 1
  /** 現在地。スライドをまたぐ時だけ state に反映して描き直す。 */
  pos: Pos = parseHash(location.hash, this.paths, this.steps)
  state = { i: this.pos[0] }

  constructor(props: DeckProps) {
    super(props)
    // URL に段階が入った状態で直接開かれた時、最初の描画から反映されるようにする。
    // ここを忘れると、ディープリンクだけ段階表示が出ない。
    deckStep = this.pos[1]
  }

  go = (next: Pos) => {
    const slideChanged = next[0] !== this.pos[0]
    this.pos = next
    deckStep = next[1]

    const hash = formatHash(next, this.paths)
    if (location.hash !== hash) history.replaceState(null, '', hash)

    // step だけなら属性を叩いて終わり。
    if (!slideChanged) return syncSteps(next[1])

    // スライドを差し替える。View Transition は DOM 変更が同期で終わることを要求するので flushSync。
    const swap = () => {
      this.setState({ i: next[0] })
      flushSync()
    }
    if (document.startViewTransition) document.startViewTransition(swap)
    else swap()
  }

  move = (dir: 1 | -1) => this.go(advance(this.pos, dir, this.steps, this.props.slides.length))

  onKey = (e: KeyboardEvent) => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ' ': 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[e.key]
    if (dir) this.move(dir as 1 | -1)
    else if (e.key === 'Home') this.go([0, 0])
    else if (e.key === 'End') this.go([this.props.slides.length - 1, this.steps(this.props.slides.length - 1) - 1])
    else if (e.key === 'f') document.fullscreenElement ? document.exitFullscreen() : document.body.requestFullscreen()
    else return
    e.preventDefault()
  }

  onHash = () => this.go(parseHash(location.hash, this.paths, this.steps))

  /** 拡大率は :root の CSS 変数。再レンダリングもスライド差し替えも巻き込まない。 */
  fit = () => {
    const { width = 1920, height = 1080 } = this.props
    const scale = Math.min(innerWidth / width, innerHeight / height)
    document.documentElement.style.setProperty('--todan-scale', String(scale))
  }

  mounted() {
    addEventListener('keydown', this.onKey)
    addEventListener('hashchange', this.onHash)
    addEventListener('resize', this.fit)
    this.fit()
    // URL を正規化し、属性を現在地に合わせる（範囲外の段階が書かれていた場合の丸め込み）。
    this.go(this.pos)
  }

  unmounted() {
    removeEventListener('keydown', this.onKey)
    removeEventListener('hashchange', this.onHash)
    removeEventListener('resize', this.fit)
  }

  render() {
    const { slides, width = 1920, height = 1080 } = this.props
    const Current = slides[this.state.i]

    return (
      <div class="deck" onClick={(e: MouseEvent) => this.move(e.shiftKey ? -1 : 1)}>
        <div class="stage" style={{ width: `${width}px`, height: `${height}px` }}>
          <Current />
        </div>
        <div class="pager">{`${this.state.i + 1} / ${slides.length}`}</div>
      </div>
    )
  }
}

/**
 * デッキを起動する。マウント先は #root、無ければ body に作る。
 * これがあるので、スライドを並べるファイル以外に置くものが無い。
 */
export function deck(slides: SlideComponent[], opts: Omit<DeckProps, 'slides'> = {}) {
  const host =
    document.getElementById('root') ?? document.body.appendChild(document.createElement('div'))
  render(<Deck slides={slides} {...opts} />, host)
}
