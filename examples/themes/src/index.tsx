import { Cols, Pad, Slide, Step, deck } from 'todan'
import 'todan/deck.css'
import 'todan/themes/noel.css'

/** どのテーマでも同じ中身を出して見比べる。スライド側に色は一切書いていない。 */
class Sampler extends Slide {
  static path = 'sampler'
  static steps = 3

  render() {
    return (
      <Pad>
        <h1>登壇</h1>
        <p>
          スライド側に色は書いていない。<code>todan/themes/*.css</code> を
          1 本読み替えるだけで全部変わる。<strong>強調はアクセント色</strong>になる。
        </p>
        <hr />
        <Cols>
          <ul>
            <Step n={1}><li>段階表示</li></Step>
            <Step n={2}><li>箇条書きの点もアクセント</li></Step>
          </ul>
          <blockquote>
            最良のコードは、書かれなかったコード。
            <cite>— よく言われるやつ</cite>
          </blockquote>
        </Cols>
      </Pad>
    )
  }
}

class Numbers extends Slide {
  static path = 'numbers'
  render() {
    return (
      <Pad>
        <h2>数字</h2>
        <div class="stats">
          <div><b>151</b><span>dom.ts の行数</span></div>
          <div><b>6.4 kB</b><span>ビルド後</span></div>
          <div><b>0</b><span>依存</span></div>
        </div>
        <style>{`
          .stats { display: flex; gap: 72px; margin-top: 48px; }
          .stats b {
            display: block; font-size: 88px; line-height: 1;
            letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
            color: var(--todan-accent);
          }
          .stats span { font-size: 26px; color: var(--todan-muted); }
        `}</style>
      </Pad>
    )
  }
}

deck([Sampler, Numbers])
