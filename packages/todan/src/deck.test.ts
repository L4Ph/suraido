import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { Window } from 'happy-dom'

/**
 * URL に段階を含めて直接開かれた場合の回帰テスト。
 * ハッシュ変更経由だと通ってしまうバグがあったので、必ず「冷えた状態の初回描画」を見る。
 *
 * deck は .tsx なので Node の型ストリップでは読めない。ビルド済みの dist を対象にする
 * （出荷するものそのものを検証できる）。
 */
const DIST = new URL('../dist/', import.meta.url)
assert.ok(existsSync(new URL('deck.js', DIST)), 'dist が無い: 先に npm run build')

async function mountDeck(hash: string) {
  const win = new Window({ url: `http://localhost/${hash}` })
  Object.assign(globalThis, {
    document: win.document,
    location: win.location,
    history: win.history,
    addEventListener: win.addEventListener.bind(win),
    removeEventListener: win.removeEventListener.bind(win),
    innerWidth: 1920,
    innerHeight: 1080,
    queueMicrotask,
  })

  // Deck と Step は現在の段階をモジュールスコープに持つので、毎回新しく読み込む
  const { Slide, Step, Deck } = await import(new URL(`deck.js?cold=${Math.random()}`, DIST).href)
  const { render } = await import(new URL('dom.js', DIST).href)
  const { jsx } = await import(new URL('jsx-runtime.js', DIST).href)

  class Points extends Slide {
    static path = 'points'
    static steps = 3
    render() {
      return jsx(Step, { n: 1, children: jsx(Step, { n: 2, children: 'x' }) })
    }
  }

  const host = win.document.createElement('div') as unknown as Element
  render(jsx(Deck, { slides: [Points] }), host)
  await new Promise((r) => setTimeout(r, 0))
  return {
    shown: [...host.querySelectorAll('.step')].map((e) => e.hasAttribute('data-shown')),
    hash: win.location.hash,
  }
}

test('冷えた状態で #points.2 を開くと、最初の描画から段階 2 まで出ている', async () => {
  const { shown, hash } = await mountDeck('#points.2')
  assert.deepEqual(shown, [true, true])
  assert.equal(hash, '#points.2')
})

test('段階なしで開いたら何も出ていない', async () => {
  const { shown } = await mountDeck('#points')
  assert.deepEqual(shown, [false, false])
})

test('範囲外の段階は丸められ、URL も正規化される', async () => {
  const { shown, hash } = await mountDeck('#points.9')
  assert.deepEqual(shown, [true, true])
  assert.equal(hash, '#points.2')
})
