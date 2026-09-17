import { test } from 'node:test'
import assert from 'node:assert/strict'
import { advance, parseHash, formatHash, type Pos, type Paths } from './nav.ts'

const steps = (i: number) => [1, 3, 2][i]
const fwd = (p: Pos) => advance(p, 1, steps, 3)
const back = (p: Pos) => advance(p, -1, steps, 3)

const unnamed: Paths = [undefined, undefined, undefined]
const named: Paths = ['intro', 'body', undefined]

test('forward walks steps then spills to the next slide', () => {
  assert.deepEqual(fwd([0, 0]), [1, 0])
  assert.deepEqual(fwd([1, 0]), [1, 1])
  assert.deepEqual(fwd([1, 2]), [2, 0])
})

test('backward lands on the previous slide last step', () => {
  assert.deepEqual(back([2, 0]), [1, 2])
  assert.deepEqual(back([1, 0]), [0, 0])
})

test('ends are sticky', () => {
  assert.deepEqual(back([0, 0]), [0, 0])
  assert.deepEqual(fwd([2, 1]), [2, 1])
})

test('positional hashes round-trip and clamp garbage', () => {
  assert.equal(formatHash([1, 2], unnamed), '#1.2')
  assert.equal(formatHash([1, 0], unnamed), '#1')
  assert.deepEqual(parseHash('#1.2', unnamed, steps), [1, 2])
  assert.deepEqual(parseHash('#9.9', unnamed, steps), [2, 1])
  assert.deepEqual(parseHash('', unnamed, steps), [0, 0])
  assert.deepEqual(parseHash('#nope', unnamed, steps), [0, 0])
})

test('named slides win over their index, unnamed ones fall back to it', () => {
  assert.equal(formatHash([0, 0], named), '#intro')
  assert.equal(formatHash([1, 2], named), '#body.2')
  assert.equal(formatHash([2, 1], named), '#2.1') // 名前なしは添字のまま
  assert.deepEqual(parseHash('#body.2', named, steps), [1, 2])
  assert.deepEqual(parseHash('#intro', named, steps), [0, 0])
})

test('a named link survives reordering the deck', () => {
  const before: Paths = ['intro', 'body', undefined]
  const after: Paths = [undefined, 'intro', 'body'] // 先頭にスライドを1枚挿した
  const link = formatHash([0, 0], before)
  assert.equal(link, '#intro')
  assert.deepEqual(parseHash(link, after, steps), [1, 0]) // 添字はずれたがリンクは生きている
})
