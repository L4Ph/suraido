import { Slide, Step, Pad, Center, Cols, Full, deck } from 'todan'
import 'todan/deck.css'
import 'todan/themes/nine009.css'
import './slides.css'

class Title extends Slide {
  static path = 'title'
  render() {
    return (
      <Center>
        <p class="eyebrow">todan — 登壇</p>
        <h1>よく使う型</h1>
        <p class="lead">毎回これを作り直すことになるので、写して使う</p>
      </Center>
    )
  }
}

class Section extends Slide {
  static path = 'section'
  render() {
    return (
      <Center class="invert">
        <p class="num">01</p>
        <h2>セクションの扉</h2>
      </Center>
    )
  }
}

class TwoCols extends Slide {
  static path = 'cols'
  static steps = 2
  render() {
    return (
      <Pad>
        <h2>二段組</h2>
        <Cols>
          <div>
            <h3>左</h3>
            <p>説明はこちら。読ませたい文章を置く。</p>
          </div>
          <Step n={1}>
            <div>
              <h3>右</h3>
              <p>図やコードを置いて、キーを押してから見せる。</p>
            </div>
          </Step>
        </Cols>
      </Pad>
    )
  }
}

class Ratio extends Slide {
  static path = 'ratio'
  render() {
    return (
      <Pad>
        <h2>比率を変える</h2>
        <Cols ratio="2fr 1fr">
          <p>本文を広く取って、右に補足を細く添える。grid-template-columns をそのまま渡せる。</p>
          <aside>
            <h3>補足</h3>
            <p>細い側。</p>
          </aside>
        </Cols>
      </Pad>
    )
  }
}

class FullBleed extends Slide {
  static path = 'full'
  render() {
    return (
      <Full>
        <img src="/photo.svg" alt="" />
        <div class="caption">
          <h2>全面</h2>
          <p>余白を無視して端まで使う。文字は上に重ねる。</p>
        </div>
      </Full>
    )
  }
}

class Quote extends Slide {
  static path = 'quote'
  render() {
    return (
      <Center>
        <blockquote>
          最良のコードは、書かれなかったコードである。
          <cite>— よく言われるやつ</cite>
        </blockquote>
      </Center>
    )
  }
}

/** スタイルをこのスライドの中に同居させる例。同時に1枚しか居ないので衝突しない。 */
class Stats extends Slide {
  static path = 'stats'
  static steps = 4
  render() {
    return (
      <Pad>
        <h2>数字を並べる</h2>
        <Cols>
          <Step n={1}><div><b>151</b><span>dom.ts の行数</span></div></Step>
          <Step n={2}><div><b>6.4 kB</b><span>ビルド後</span></div></Step>
          <Step n={3}><div><b>0</b><span>依存</span></div></Step>
        </Cols>

        <style>{`
          .todan-cols b {
            display: block;
            font-size: 88px;
            line-height: 1;
            letter-spacing: -0.03em;
            font-variant-numeric: tabular-nums;
            color: var(--todan-accent);
          }
          .todan-cols span { font-size: 26px; color: var(--todan-muted); }
        `}</style>
      </Pad>
    )
  }
}

deck([Title, Section, TwoCols, Ratio, FullBleed, Quote, Stats])
