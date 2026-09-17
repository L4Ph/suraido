# todan

**登壇** — 壇に上がること。

JSX でスライドを書く。React も VDOM も無し。

```
npm create todan@latest my-deck
```

依存ゼロ、ビルド 6.4 kB (gzip 2.9 kB)。

## 構成

| ファイル | 行 | 中身 |
|---|---|---|
| [src/jsx-runtime.ts](src/jsx-runtime.ts) | 31 | JSX → `{type, props, key}` + `JSX` 型定義 |
| [src/dom.ts](src/dom.ts) | 162 | vnode → DOM 生成、`Component` と `setState` / `flushSync` |
| [src/nav.ts](src/nav.ts) | 26 | スライド/段階の移動と URL。純粋関数 |
| [src/deck.tsx](src/deck.tsx) | 132 | `Slide` / `Step` / `Deck` / `deck()` |
| [src/layout.tsx](src/layout.tsx) | 57 | `Pad` / `Center` / `Cols` / `Full` |
| [src/themes/](src/themes) | — | キーキャップのカラーウェイ 6 種 |

`tsconfig.json` の `jsxImportSource: "todan"` だけで繋がる。Vite はこれを読むので
vite.config.ts に JSX の設定は要らない。

## 書き方

ファイルは 1 つ。スライドを並べて `deck()` に渡すところまでが全部入る。

```tsx
// src/index.tsx
import { Slide, Step, Center, Pad, Cols, deck } from 'todan'
import 'todan/deck.css'
import 'todan/themes/olivia.css'

class Intro extends Slide<{}, { count: number }> {
  static path = 'intro'     // → #intro.1（省略すると #0.1）
  static steps = 2          // このスライドが吸収するキー入力の回数
  state = { count: 0 }

  mounted() { /* タイマーや video の制御はここ */ }
  updated() { /* 作り直しの直後。フォーカスなど DOM 側の状態を戻す */ }
  unmounted() {}

  render() {
    return (
      <Pad>
        <h2>タイトル</h2>
        <Cols ratio="2fr 1fr">
          <p>本文。<strong>強調</strong>はアクセント色になる。</p>
          <img src="/photo.jpg" />
        </Cols>
        <Step n={1}><p>2 回目のキーで出る</p></Step>
      </Pad>
    )
  }
}

deck([Intro])
```

`deck()` は `#root` を探し、無ければ `body` に容器を作って描き始める。

### 組み込みコンポーネント

毎回書くことになる配置だけを持っている。どれもクラス名は `todan-` 始まりで
`@layer` の中なので、素の CSS で上書きできる。

| | 中身 |
|---|---|
| `<Pad>` | スライド本体。高さいっぱい + `--todan-pad` の余白 |
| `<Center>` | `<Pad>` と同じで、中身を縦方向の中央に寄せる。表紙やセクションの扉に |
| `<Cols>` | 段組み。子の数だけ列ができる。`ratio="2fr 1fr"` で比率を指定 |
| `<Full>` | 余白を無視して端まで。直下の `img` / `video` が全面に敷かれる |
| `<Step n={1}>` | 到達するまで透明。場所は取り続けるのでレイアウトが動かない |

これ以外は素の HTML を書く。`<img>` `<video>` `<table>` `<svg>` はそのまま使えて、
`<svg>` 以下は自動で SVG 名前空間になる。見出し・本文・箇条書き・引用・`code` には
`todan.type` レイヤーで体裁が入っているので、`<h2>` と書けばスライド用の大きさになる。

## 操作

`→ ↓ Space` 進む / `← ↑` 戻る / `Home` `End` / `f` フルスクリーン / クリック進む・Shift+クリック戻る。
位置は `#intro.1` で URL に入る。リロードしてもその場所。`replaceState` なので履歴は積まない
（ブラウザバックは ← と競合せず、デッキ自体を抜ける）。

## ビルドツール

統合点は tsconfig の 1 行だけ。

```json
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "todan" } }
```

| | 追加設定 |
|---|---|
| Vite | 不要 |
| Rsbuild | 不要 |
| 素の Rspack | 必要（下記） |

Vite も Rsbuild も tsconfig の `jsxImportSource` を読むので、`npm create todan` が作った
プロジェクトはそのまま両方でビルドできる。エントリを `src/index.tsx` にしてあるのは
Rsbuild の既定のエントリに合わせるため（Vite は `index.html` の script src を見るので影響なし）。

素の Rspack をバンドラとして直接使う場合だけ、SWC が tsconfig を見ないので loader に明示する:

```js
{
  test: /\.tsx?$/,
  loader: 'builtin:swc-loader',
  options: {
    jsc: {
      parser: { syntax: 'typescript', tsx: true },
      transform: { react: { runtime: 'automatic', importSource: 'todan' } },
    },
  },
}
```

`importSource` を書き忘れると SWC が `react/jsx-runtime` を探しに行って
`Can't resolve 'react/jsx-runtime'` で止まる。todan 側の問題に見えないので注意。

## テーマ

CSS を 1 本読むだけ。中身は `--todan-*` の上書きだけで、JS は無い。

```ts
import 'todan/deck.css'
import 'todan/themes/olivia.css'
```

キーキャップのカラーウェイから採っている。

| | 地 | 明暗 | 用途 |
|---|---|---|---|
| `olivia` | 生成り + サーモン | 明 | 上品で無難。迷ったらこれ |
| `noel` | 淡いアクア + 桜色 | 明 | やわらかい、かわいい寄り |
| `nine009` | 灰味ベージュ + 橙 | 明 | レトロな計算機の色 |
| `botanical` | 生成り + 深緑 | 明 | 落ち着いた、文字の多い話向け |
| `dolch` | 黒 + 灰 + 白 | 暗 | 単色。どんな照明でも潰れない |
| `laser` | 深い紫 + マゼンタ/シアン | 暗 | 派手にやりたい時 |

どのテーマも**プロジェクタで読める明暗差をテストで縛ってある**
（本文 7:1 以上、補足 4.5:1 以上、見出し・図形 3:1 以上）。
テーマを足す時も同じ基準を通す必要がある。手元の画面で綺麗でも会場で読めない配色を防ぐため。

自前のテーマは同じトークンを書けばいい。`:root` に置けば todan のレイヤーに勝つ。

## スタイルの境界

todan のスタイルは**全部 `@layer` の中**にある。レイヤー付きのスタイルはレイヤー無しに必ず負けるので、
利用側は素のセレクタを書くだけで何でも上書きできる。`!important` も特異度の細工も要らない。

```css
/* あなたの CSS。todan の .pager より特異度が低くても勝つ */
.pager { display: none; }
```

境界は3層:

| 層 | 中身 | 扱い |
|---|---|---|
| **仕組み** | `.stage` の `position` / `transform` / `transform-origin`、`--todan-scale`、`.step[data-shown]` | 上書きすると拡大縮小と段階表示が壊れる |
| **トークン** | `--todan-*` | **上書き前提の公開 API**。テーマはこれだけを書き換える |
| **見た目** | `.deck` / `.stage` の色、`.pager`、遷移 | 自由に上書き |

### トークン

```css
:root {
  --todan-fg: #16181d;        /* 文字色 */
  --todan-bg: #fbfaf8;        /* スライドの地 */
  --todan-accent: #2f6df6;
  --todan-muted: #6b7280;
  --todan-font: system-ui, "Hiragino Sans", sans-serif;
  --todan-pad: 96px 120px;    /* スライドの余白（使うかは利用側の自由） */
  --todan-letterbox: #111;    /* 画面とスライドの間に出る色 */
  --todan-accent-2: var(--todan-accent);
  --todan-rule: …;            /* 罫線 */
  --todan-font-mono: …;

  --todan-h1: 92px;           /* 1920x1080 上の実寸 */
  --todan-h2: 60px;
  --todan-h3: 34px;
  --todan-text: 32px;

  --todan-step-fade: 200ms;
  --todan-slide-fade: 180ms;
}
```

見出し・本文・箇条書き・引用・`code` には `todan.type` レイヤーで最低限の体裁が入っている。
全部トークンで書いてあるので、テーマ側は値を差し替えるだけで全体が動く。

### スタイルをスライドに同居させる

CSS Modules のような別ファイルにしなくても、`<style>` をスライドの中にそのまま書ける。
**同時にマウントされるスライドは 1 枚だけ**なので、書いたスタイルはそのスライドが表に居る間だけ効く。
スライドを離れると `<style>` ごと外れる。

```tsx
class Stats extends Slide {
  render() {
    return (
      <section class="pad">
        <div class="stats">...</div>
        <style>{`
          .stats { display: flex; gap: 80px; }
          .stats b { font-size: 96px; color: var(--todan-accent); }
        `}</style>
      </section>
    )
  }
}
```

同居の手段は3つあり、できることが違う:

| | 擬似クラス / 擬似要素 | メディアクエリ | 子孫セレクタ | keyframes |
|---|---|---|---|---|
| `style={{ }}` | ✗ | ✗ | ✗ | ✗ |
| スライド内の `<style>` | ✓ | ✓ | ✓ | ✓ |
| 外部 `.css` | ✓ | ✓ | ✓ | ✓ |

`style={{ }}` は 1 つの値を差し込む用（上の例の `width: ${pct}%` など）。
それ以外は `<style>` を使えば、別ファイルにせずに全部書ける。


## スライド遷移

スライドをまたぐ差し替えは View Transitions でクロスフェードする。速さは CSS 変数:

```css
:root { --slide-fade: 180ms; }   /* 既定 180ms */
```

- **step の移動では遷移しない**。`.step` の opacity transition がそのまま担当する
- `prefers-reduced-motion: reduce` で遷移も段階表示のフェードも切れる
- `document.startViewTransition` が無いブラウザでは、単に瞬間的に切り替わる（機能検出あり）

`::view-transition-group(root)` にも同じ duration を当てている。ここを省くと group だけ
UA 既定の 250ms が残り、遷移の完了が 70ms ほど遅れて連打時にもたつく。

## 再レンダリングしない経路

段階表示と拡大率は、意図的に `render()` を通らない:

- **step の切り替え** → `.step` の `data-shown` 属性を叩くだけ。CSS transition が生き残る
- **リサイズ** → `:root` の `--scale` を書き換えるだけ。スライドの DOM に触らない

`render()` が走るのは **スライドをまたぐ時**と**スライド自身の `setState`** だけ。

## 状態のライフサイクル

- `setState` → **そのスライドの DOM を作り直す**（差分は取らない）
- スライドをまたぐ → アンマウントされて state はリセット
- スライド間で状態を共有する仕組みは**無い**。必要になったら nanostores なり `atom` 自作なりを外に置き、
  `mounted()` で `subscribe` して `setState` を呼ぶ

## 割り切っているところ

- **`setState` は DOM の同一性を保たない**。`<video>`、フォーカス中の `<input>`、進行中の transition を
  `setState` するスライドに置くと壊れる。フォーカスやスクロールは `updated()` で戻せる
  （[examples/interactive](../../examples/interactive) 参照）。丸ごと避けたいなら差分適用を戻すこと
  （[dom.ts](src/dom.ts) の `flush()` を patch ベースに戻す ≒ 50 行）
- **段階表示は `<Step>` 経由のみ**。`render()` の中で step による条件分岐はできない
- **コンポーネントのルートは単一要素**。複数返すと最初のひとつだけ描画される
- **`<Step>` はモジュール変数から現在の step を読む**。デッキを画面に 2 つ並べるなら持ち方を変える
- `slides` にはクラスをそのまま並べる。`(p) => <Demo {...p} />` でラップすると `static steps` / `path` が消える
- DOM ハンドルを取る `ref` は無い。`<video>` や `<canvas>` を触りたくなったら足す（5 行程度）
