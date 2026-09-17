import { Pad, Slide, Step, deck } from 'todan'
import 'todan/deck.css'
import './slides.css'

/** 会場に手を挙げてもらう代わりに、その場で数える。 */
class Tally extends Slide<{}, { counts: number[] }> {
  static path = 'tally'
  static labels = ['書いたことがある', '見たことはある', '初めて聞いた']
  state = { counts: [0, 0, 0] }

  bump(i: number) {
    this.setState((s) => ({ counts: s.counts.map((n, j) => (j === i ? n + 1 : n)) }))
  }

  render() {
    const total = this.state.counts.reduce((a, b) => a + b, 0)
    return (
      <Pad>
        <h2>JSX、どのくらい書きます?</h2>
        <div class="poll">
          {Tally.labels.map((label, i) => {
            const n = this.state.counts[i]
            return (
              <button onClick={(e: MouseEvent) => (e.stopPropagation(), this.bump(i))}>
                <span class="bar" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
                <span class="label">{label}</span>
                <span class="n">{n}</span>
              </button>
            )
          })}
        </div>
        <p class="hint">クリックで加算。Shift+クリックで前に戻るので、押すのはボタンの上だけ。</p>
      </Pad>
    )
  }
}

/**
 * 動くものを埋め込む。setState を使わず DOM を直接触るので、
 * スライドの作り直しが起きない = 描画が途切れない。
 */
class Animation extends Slide {
  static path = 'raf'
  canvas: HTMLCanvasElement | null = null
  raf = 0

  mounted() {
    this.canvas = document.querySelector('#wave')
    const ctx = this.canvas?.getContext('2d')
    if (!ctx) return
    const t0 = performance.now()
    const draw = (t: number) => {
      const { width: w, height: h } = ctx.canvas
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--todan-accent')
      ctx.lineWidth = 6
      ctx.beginPath()
      for (let x = 0; x <= w; x += 4) {
        const y = h / 2 + Math.sin((x + (t - t0) / 4) / 90) * (h / 3) * Math.sin((t - t0) / 1600)
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      }
      ctx.stroke()
      this.raf = requestAnimationFrame(draw)
    }
    this.raf = requestAnimationFrame(draw)
  }

  /** スライドを離れたら止める。これが無いと裏で回り続ける。 */
  unmounted() {
    cancelAnimationFrame(this.raf)
  }

  render() {
    return (
      <Pad>
        <h2>動くものを置く</h2>
        <canvas id="wave" width="1600" height="420" />
        <p class="hint">
          <code>mounted()</code> で rAF を回し、<code>unmounted()</code> で止める。
          setState を使っていないので作り直しが起きない。
        </p>
      </Pad>
    )
  }
}

/**
 * setState は DOM を作り直す。入力欄にはこれが二重に効いてくる。
 *
 *  1. 打っている最中に setState すると、その都度フォーカスが飛ぶ
 *     → 値は DOM に持たせたままにして、確定した時だけ state に移す
 *  2. 確定時の setState でも input ごと作り直される
 *     → updated() でフォーカスを戻す
 */
class Typing extends Slide<{}, { submitted: string[] }> {
  static path = 'input'
  static steps = 2
  state = { submitted: [] as string[] }

  /** 作り直しの直後に呼ばれる。入力欄にフォーカスを返して、続けて打てるようにする。 */
  updated() {
    document.querySelector<HTMLInputElement>('.field')?.focus()
  }

  onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLInputElement
    if (e.key !== 'Enter' || !el.value.trim()) return
    const value = el.value.trim()
    el.value = ''
    this.setState((s) => ({ submitted: [...s.submitted, value] }))
  }

  render() {
    return (
      <Pad>
        <h2>入力を受ける</h2>
        <input
          class="field"
          placeholder="書いて Enter"
          onKeydown={this.onKey}
          onClick={(e: MouseEvent) => e.stopPropagation()}
        />
        <ul class="answers">
          {this.state.submitted.map((s) => (
            <li>{s}</li>
          ))}
        </ul>
        <Step n={1}>
          <p class="hint">
            打っている間は setState しない（値は DOM 側に置く）。
            Enter で確定した時だけ state に移し、作り直された入力欄に
            <code>updated()</code> でフォーカスを返す。
          </p>
        </Step>
      </Pad>
    )
  }
}

deck([Tally, Animation, Typing])
