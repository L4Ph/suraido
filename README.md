# todan

**登壇** — 壇に上がること。JSX でスライドを書くためのフレームワーク。

React も VDOM も使わない。JSX は自前のランタイムで DOM になる。
ビルドツールへの統合は tsconfig の 1 行だけで、Vite でも Rsbuild でもそのまま動く。

```
npm create todan@latest my-deck
```

## パッケージ

| | 説明 |
|---|---|
| [todan](packages/todan) | フレームワーク本体。JSX ランタイム、`Slide` / `Step` / `Deck` |
| [create-todan](packages/create-todan) | `npm create todan` でプロジェクトを作る |

## 例

| | |
|---|---|
| [basic](examples/basic) | 最小構成。表紙・段階表示・クラスの状態 |
| [layouts](examples/layouts) | 表紙 / セクション扉 / 二段組 / 全面 / 引用 / 数字。**写して使う用** |
| [themes](examples/themes) | 同じ中身を 6 つのテーマで見比べる |
| [interactive](examples/interactive) | その場で数える投票、rAF の埋め込み、入力欄。markdown スライドにできないこと |

```
npm run dev -w example-layouts
```

## 開発

```
npm install
npm run dev     # packages/create-todan/template をそのまま動かす
npm test
npm run build
```

テンプレートはワークスペースを兼ねている。リポジトリ内ではこれが開発用のデッキで、
`create-todan` は同じものをコピーして配る。二重管理にならない。
