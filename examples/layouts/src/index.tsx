import {
  Aside,
  Body,
  Center,
  Code,
  Cols,
  Cover,
  deck,
  Divider,
  Figure,
  font,
  Full,
  Lead,
  Matrix,
  Pad,
  Points,
  Side,
  slide,
  Stat,
  Step,
} from "suraido.js";
import "suraido.js/deck.css";
import "suraido.js/themes/nine009.css";
import "./slides.css";

await font("ibm-plex-sans-jp");

/**
 * A deck is a list of slides, so they can be written straight into it. Naming them first —
 * the way the other examples do — gives the deck() call a table of contents and lets one move
 * to a file of its own. For a short catalogue, the list is already the table of contents.
 *
 * Each slide here is one shape from `suraido.js`, kept because every deck writes it again.
 * Copy the JSX, not the stylesheet: the look comes from the tokens.
 */
deck([
  slide({ path: "title" }, () => (
    <Cover
      title="Shapes you keep needing"
      byline={["suraido.js — スライド", "They are in the box now, so stop rebuilding them"]}
      align="center"
    />
  )),
  slide({ path: "section" }, () => (
    <Divider class="invert" align="center">
      <p class="num">01</p>
      <h2>A section divider</h2>
    </Divider>
  )),
  slide({ path: "body" }, () => (
    <Pad>
      <h2>What is under the heading</h2>
      <Body>
        <p>
          <code>&lt;Body&gt;</code> takes the rest of the slide and centres itself in what is left.
          Content of different heights then sits in the same place from slide to slide, instead of
          hanging off the heading.
        </p>
        <Aside>The shape eleven slides of one real deck were written in.</Aside>
      </Body>
    </Pad>
  )),
  slide({ path: "cols" }, () => (
    <Pad>
      <h2>Two columns</h2>
      <Cols align="center">
        <Side heading="Left">
          <p>The explanation goes here — the part you want read.</p>
        </Side>
        <Step n={1}>
          <Side heading="Right">
            <p>A diagram or some code, held back until you press the key.</p>
          </Side>
        </Step>
      </Cols>
    </Pad>
  )),
  slide({ path: "ratio" }, () => (
    <Pad>
      <h2>Changing the proportions</h2>
      <Cols ratio="2fr 1fr" align="start">
        <p>
          Give the body most of the width and set a narrow aside beside it. Whatever you pass goes
          straight to grid-template-columns.
        </p>
        <Side heading="Aside">
          <p>The narrow one.</p>
        </Side>
      </Cols>
    </Pad>
  )),
  slide({ path: "full" }, () => (
    <Full>
      <img src="/photo.svg" alt="" />
      <div class="caption">
        <h2>Full bleed</h2>
        <p>Ignore the padding and run to the edges. Text sits on top.</p>
      </div>
    </Full>
  )),
  slide({ path: "points" }, () => (
    <Pad>
      <h2>Term, then what it means</h2>
      <Points
        items={[
          { term: "メッセージが届かなかったとき", body: "期限が切れたら回収して再投入する" },
          { term: "失敗したとき", body: "3回まで再投入する。待ち時間は30秒から倍々に延ばす" },
          { term: "処理が長いとき", body: <>実行中に heartbeat を送って期限を延ばす</> },
        ]}
      />
      <Aside>A &lt;dl&gt;, so a screen reader reads each pair as a pair.</Aside>
    </Pad>
  )),
  slide({ path: "figures" }, () => (
    <Pad>
      <h2>Figures side by side</h2>
      <Cols align="center">
        <Figure caption="fit=contain, paper" fit="contain" paper max={560}>
          <img src="/photo.svg" alt="" />
        </Figure>
        <Step n={1}>
          <Figure caption="fit=width" fit="width">
            <img src="/photo.svg" alt="" />
          </Figure>
        </Step>
      </Cols>
    </Pad>
  )),
  slide({ path: "stats" }, () => (
    <Pad>
      <h2>Figures worth reading from the back</h2>
      <Cols>
        <Step n={1}>
          <Stat value="166" label="lines in dom.ts" />
        </Step>
        <Step n={2}>
          <Stat value="7.4 kB" label="built, gzipped" />
        </Step>
        <Step n={3}>
          <Stat value="0" label="dependencies" />
        </Step>
      </Cols>
    </Pad>
  )),
  slide({ path: "lead" }, () => (
    <Pad>
      <h2>まとめ</h2>
      <Body>
        <Lead>オンプレGPUインフラはCPUインフラと同じ前提が通用しない</Lead>
        <ul>
          <li>CIはセルフホスト＋ラベルと夜間実行で折り合いをつける</li>
          <li>デプロイはapp-onlyとfullを分ける</li>
        </ul>
      </Body>
    </Pad>
  )),
  slide({ path: "matrix" }, () => (
    <Pad>
      <h2>Rows and columns</h2>
      <Matrix
        head={["機能", "配送", "失敗したとき"]}
        rows={[
          ["画像生成", "Queues と consumer", "3回まで再投入する"],
          ["メール送信", "リクエスト中に同期送信", "だめならSendGridで送る"],
          ["サムネイル生成", "await か waitUntil", "再試行しない"],
        ]}
      />
      <Aside>
        The first cell of a row is its name, so it is a th — not a td with a class on it.
      </Aside>
    </Pad>
  )),
  slide({ path: "code" }, () => (
    <Pad>
      <h2>Source</h2>
      <Cols ratio="1.15fr 1fr" align="start">
        <div>
          <Code label="backend/src/queue-kit/tasks.ts（抜粋）">
            {`export const tasks = defineTasks<Env>({
  tasks: {
    SendMail: task({
      policy: { stallMs: 5 * 60_000 },
      run: async (env, msg) => { … },
    }),
  },
});`}
          </Code>
        </div>
        <Code size="s" label="The same block at size='s'">
          {`for (const msg of batch.messages) {
  await runDispatch(msg.body, coord);
  await coord.complete(taskId, attempt);
  msg.ack();
}`}
        </Code>
      </Cols>
    </Pad>
  )),
  slide({ path: "quote" }, () => (
    <Center>
      <blockquote>
        The best code is the code that was never written.
        <cite>— the thing everyone says</cite>
      </blockquote>
    </Center>
  )),
]);
