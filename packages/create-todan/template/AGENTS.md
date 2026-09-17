# このリポジトリについて

[todan](https://github.com/L4Ph/todan) で書かれたスライド。JSX でスライドを組み、ブラウザで表示する。

**React ではない。** JSX は todan 自前のランタイムで DOM になる。React の作法を持ち込まないこと。

## 置き場所

```
src/index.tsx    スライドの定義と deck() 呼び出し。ここが全部
src/slides.css   このデッキ固有のスタイル
index.html
```

スライドが増えたら `src/slides/*.tsx` に分けて `index.tsx` で import し、`deck([...])` に並べる。

## 書き方

```tsx
import { Slide, Step, Pad, Center, Cols, Full, deck } from 'todan'

class Intro extends Slide<{}, { count: number }> {
  static path = 'intro'   // URL が #intro になる。省略すると添字
  static steps = 2        // このスライドが吸収するキー入力の回数
  state = { count: 0 }

  render() {
    return (
      <Pad>
        <h2>見出し</h2>
        <Step n={1}><p>2 回目のキーで出る</p></Step>
      </Pad>
    )
  }
}

deck([Intro])
```

## 守ること

- **`className` ではなく `class`。** props は DOM の属性にそのまま渡る。
  イベントは `onClick` → `addEventListener('click')`。
- **`deck()` に渡す配列にはクラスをそのまま並べる。**
  `(p) => <Intro {...p} />` のようにラップすると `static steps` / `path` が消えて、
  段階表示と URL が壊れる。props を渡したくなったらサブクラスを作る。
- **コンポーネントの `render()` は単一の要素を返す。** 複数返すと最初のひとつだけが描画される。
- **`<ul>` や `<ol>` の中で段階表示を使う時は `<Step n={1} as="li">`。**
  `as` を省くと div が挟まって `ul > li` が効かなくなる。
- **`render()` の中で現在の段階による分岐はできない。** 段階表示は `<Step>` だけ。
  step が変わっても `render()` は呼ばれない（属性の付け外しだけで済ませている）。

## 状態

`setState` は**そのスライドの DOM を作り直す**（差分適用はしていない）。つまり:

- `<video>` は巻き戻り、フォーカス中の `<input>` はフォーカスを失い、進行中の transition は途切れる
- 復旧は `updated()` で行う。作り直しの直後に呼ばれる

```tsx
updated() {
  document.querySelector<HTMLInputElement>('.field')?.focus()
}
```

- 入力欄は「打っている間 setState しない」。値は DOM に持たせ、確定時だけ state に移す
- タイマーや rAF は `mounted()` で開始し、**必ず `unmounted()` で止める**
- スライドをまたぐとアンマウントされて state は消える。
  スライド間で共有したい値はモジュールスコープか外部ストアに置く

## スタイル

todan のスタイルは全て `@layer` の中にある。**ここに素のセレクタを書けば必ず勝つ**
（特異度も `!important` も不要）。

配色とサイズは CSS 変数を上書きする。個別のセレクタを書くより先にこちらを試すこと。

```css
:root {
  --todan-fg: #16181d;
  --todan-bg: #fbfaf8;
  --todan-accent: #2f6df6;
  --todan-muted: #6b7280;
  --todan-font: system-ui, sans-serif;
  --todan-pad: 96px 120px;
  --todan-gap: 72px;
  --todan-h1: 92px;
  --todan-h2: 60px;
  --todan-text: 32px;
}
```

テーマを丸ごと差し替えるなら `import 'todan/themes/<name>.css'` を入れ替える
（`olivia` `noel` `nine009` `botanical` `dolch` `laser`）。

**スライド 1 枚に閉じたスタイルは、そのスライドの中に `<style>` で書いてよい。**
同時にマウントされるスライドは 1 枚だけなので、離れると `<style>` ごと外れる。

```tsx
render() {
  return (
    <Pad>
      <div class="stats">…</div>
      <style>{`.stats b { font-size: 96px; color: var(--todan-accent); }`}</style>
    </Pad>
  )
}
```

`style={{ }}` も使えるが、擬似クラス・擬似要素・メディアクエリ・子孫セレクタが書けない。
1 つの値を差し込む用途（`width: ${pct}%` など）に留める。

**スライドは 1920x1080 の固定キャンバスに描かれ、画面に合わせて縮小される。**
px は常にこのキャンバス上の実寸。`clamp()` も `vw` もメディアクエリも要らない。

`.stage` の `position` / `transform` / `transform-origin` は仕組みなので触らない。

## 座標と操作

URL は `#<スライド>.<段階>`（例 `#intro.2`）。リロードしてもその位置。

`→ ↓ Space` 進む / `← ↑` 戻る / `Home` `End` / `f` 全画面 /
クリックで進む・Shift+クリックで戻る。

スライド内のボタンは `e.stopPropagation()` を呼ぶこと。呼ばないとクリックでスライドが進む。

## コマンド

```
npm run dev      開発サーバ
npm run build    本番ビルド
```
