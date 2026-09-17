---
name: rehearse
description: 通し稽古 — todan のデッキを全スライド出して測り、壇上で初めて気づく事故を潰す。切り落とされた内容、読めないコントラスト、表示されない画像、合っていない段階数を見つける。Use when the user asks to check, review, or rehearse the deck, asks whether it is ready to present, or reports that something looks cut off, missing, or not showing.
---

# 通し稽古

todan のスライドは 1920x1080 の固定キャンバスに描かれ、`.stage` は `overflow: hidden`。
**はみ出した内容は警告も無く切り落とされる。** 全体が縮小して表示されるので、
画面を眺めても切れたことに気づけない。壇上で気づくのが最悪の形。

目で見ずに数値を取る。切れているかどうかは目では分からない。

## 1. 台本を作る

`deck([...])` の配列を読み、**1 スライド 1 位置**の通しリストを作る。
`static path` があれば `#<path>`、無ければ `#<添字>`。

段階（`<Step>`）ごとに回る必要はない。`<Step>` は隠れていても場所を取り続ける仕様なので、
段階を進めても高さは変わらない。ただし `.step` を `display: none` で隠す上書きを
入れているデッキなら、そのスライドだけ全段階を回る。

完了条件: スライド数と同じ長さのリストができていること。

## 2. 書き方の検査

`AGENTS.md` の「守ること」を開き、**各項目についてデッキ全体から違反を探す**。
ブラウザは要らない。

完了条件: 「守ること」の全項目を、全スライドに対して見終えていること。

## 3. 通し稽古

開発サーバを起動し、台本の位置を 1 つずつ開いて測る。1 位置 1 回の JS で 3 つとも取れる:

```js
const s = document.querySelector('.stage')
;({
  clippedY: s.scrollHeight - s.clientHeight,   // > 0 なら下が切れている
  clippedX: s.scrollWidth - s.clientWidth,     // > 0 なら右が切れている
  brokenImages: [...s.querySelectorAll('img')]
    .filter(i => i.naturalWidth === 0).map(i => i.getAttribute('src')),
})
```

加えて、地に対して文字が読めるか（本文と背景の明暗差 4.5 未満は事故）。

完了条件: **台本の全位置**について測定値が揃っていること。
数枚見て「大丈夫そう」で止めない。切れは 1 枚ずつ違う。

## 4. 報告

事故のあった位置ごとに `#<path>` と測定値（切れた px 数、コントラスト比、画像の src）を出し、
原因になっている要素を指す。事故が無ければ、通したスライド数を添えてそう言う。

直すのは指示されてから。報告と修正を混ぜない。
