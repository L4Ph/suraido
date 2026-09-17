import type { Child } from './dom.ts'

/**
 * どのデッキでも毎回書くことになる配置だけを用意する。
 * 見た目はトークンから引いているので、テーマを替えれば一緒に動く。
 * クラス名は `todan-` 始まりで、すべて @layer の中。利用側の素の CSS が必ず勝つ。
 */

type Box = { class?: string; children?: Child; [attr: string]: unknown }

const cx = (...names: unknown[]) => names.filter(Boolean).join(' ')

/** スライド本体。高さいっぱい + `--todan-pad` の余白。 */
export function Pad({ class: cls, children, ...rest }: Box) {
  return (
    <section class={cx('todan-pad', cls)} {...rest}>
      {children}
    </section>
  )
}

/** Pad と同じだが、中身を縦方向の中央に寄せる。表紙やセクションの扉に。 */
export function Center({ class: cls, children, ...rest }: Box) {
  return (
    <section class={cx('todan-pad', 'todan-center', cls)} {...rest}>
      {children}
    </section>
  )
}

/**
 * 段組み。子の数だけ列ができる。
 * `ratio` に grid-template-columns をそのまま渡せば比率を変えられる（例 "2fr 1fr"）。
 */
export function Cols({ ratio, class: cls, children, ...rest }: Box & { ratio?: string }) {
  return (
    <div
      class={cx('todan-cols', cls)}
      style={ratio ? { gridTemplateColumns: ratio, gridAutoFlow: 'row' } : undefined}
      {...rest}
    >
      {children}
    </div>
  )
}

/**
 * 余白を無視して端まで使う。直下の img / video はスライド全面に敷かれる。
 * 文字を重ねたい時は position: absolute の要素を中に置く。
 */
export function Full({ class: cls, children, ...rest }: Box) {
  return (
    <section class={cx('todan-full', cls)} {...rest}>
      {children}
    </section>
  )
}
