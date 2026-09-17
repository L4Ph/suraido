import { Center, Pad, Slide, Step, deck } from 'todan'
import 'todan/deck.css'
import './slides.css'

class Cover extends Slide {
  static path = 'intro'

  render() {
    return (
      <Center>
        <h1>JSXでスライドを書く</h1>
        <p class="lead">React も VDOM も無し。JSX は自前の <code>jsx()</code> に落ちる。</p>
        <img src="/logo.svg" alt="" width="160" height="160" />
      </Center>
    )
  }
}

class Agenda extends Slide {
  static path = 'parts'
  static steps = 4

  render() {
    return (
      <Pad>
        <h2>フレームワークの中身</h2>
        <ul class="bullets">
          <Step n={1}>
            <li><code>jsx-runtime</code> — JSX を vnode にするだけの 8 行</li>
          </Step>
          <Step n={2}>
            <li><code>dom.ts</code> — vnode から DOM を生成 + クラスの状態</li>
          </Step>
          <Step n={3}>
            <li><code>deck.tsx</code> — 固定キャンバスの縮小とキー操作</li>
          </Step>
        </ul>
      </Pad>
    )
  }
}

/** 状態はクラスに持たせる。setState はこのスライドの DOM を作り直す。 */
class Demo extends Slide<{}, { count: number }> {
  static path = 'state'
  static steps = 2
  state = { count: 0 }

  render() {
    return (
      <Pad>
        <h2>クラスで持つ状態</h2>
        <button class="big" onClick={(e: MouseEvent) => (e.stopPropagation(), this.setState((s) => ({ count: s.count + 1 })))}>
          押した回数: {this.state.count}
        </button>
        <Step n={1}>
          <p class="lead">2 回目のキーで出てくる要素</p>
        </Step>
      </Pad>
    )
  }
}

// スライドはクラスをそのまま並べる。ここでラップすると static steps / path が失われるので注意。
deck([Cover, Agenda, Demo])
