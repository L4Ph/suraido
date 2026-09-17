import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * スライドは光の飛んだプロジェクタに映る。低コントラストのテーマは
 * 手元の画面では綺麗でも会場では読めないので、数値で縛っておく。
 */

const DIR = new URL('./themes/', import.meta.url).pathname

const srgb = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

function luminance(hex: string) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map((i) => srgb(parseInt(full.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function tokens(css: string) {
  const out: Record<string, string> = {}
  for (const [, k, v] of css.matchAll(/--todan-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out[k] = v
  return out
}

const themes = readdirSync(DIR).filter((f) => f.endsWith('.css'))

test('every theme ships the tokens the contrast rules depend on', () => {
  assert.ok(themes.length > 0, 'テーマが 1 つも無い')
  for (const file of themes) {
    const t = tokens(readFileSync(join(DIR, file), 'utf8'))
    for (const key of ['bg', 'fg', 'accent', 'accent-2', 'muted']) {
      assert.ok(t[key], `${file}: --todan-${key} が無い`)
    }
  }
})

for (const file of themes) {
  test(`${file} は会場で読める明暗差がある`, () => {
    const t = tokens(readFileSync(join(DIR, file), 'utf8'))
    const ratio = (k: string) => contrast(t[k], t.bg)

    // 本文。WCAG AAA 相当。プロジェクタで飛ぶぶんの余裕を持たせる。
    assert.ok(ratio('fg') >= 7, `${file}: fg/bg = ${ratio('fg').toFixed(2)} (7 以上必要)`)
    // 補足テキスト。AA 相当。
    assert.ok(ratio('muted') >= 4.5, `${file}: muted/bg = ${ratio('muted').toFixed(2)} (4.5 以上必要)`)
    // 見出し・罫線・大きい数字。大きい文字と図形の基準。
    for (const k of ['accent', 'accent-2']) {
      assert.ok(ratio(k) >= 3, `${file}: ${k}/bg = ${ratio(k).toFixed(2)} (3 以上必要)`)
    }
  })
}
