# create-todan

```
npm create todan@latest my-deck
```

[todan](../todan) のスライドプロジェクトを作る。生成物には 2 つ入っている。

**`AGENTS.md`** — todan の作法をコーディングエージェントに伝える。
`class` を使う・`deck()` に渡す配列はラップしない・`setState` は DOM を作り直す・
スタイルは `@layer` の外から上書きする、など。

**`.agents/skills/rehearse/`** — 通し稽古の skill。全スライドを開いて測り、
1920x1080 から**はみ出して切り落とされた内容**（`overflow: hidden` なので見ても気づけない）、
読めないコントラスト、表示されない画像を見つける。
