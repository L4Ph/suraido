import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { Component, render, type Child } from './dom.ts'
import { jsx } from './jsx-runtime.ts'

const win = new Window()
Object.assign(globalThis, { document: win.document, queueMicrotask })

const h = (type: any, props: Record<string, any> = {}, ...kids: any[]) =>
  jsx(type, kids.length ? { ...props, children: kids.length === 1 ? kids[0] : kids } : props)

const root = () => win.document.createElement('div') as unknown as Element
const tick = () => new Promise((r) => setTimeout(r, 0))

class Box extends Component<{ label: string }, { n: number }> {
  state = { n: 0 }
  render(): Child {
    return h(
      'div',
      {},
      h('img', { src: '/cat.png' }),
      h('span', {}, `${this.props.label}:${this.state.n}`),
      this.state.n > 0 ? h('p', {}, 'extra') : null,
    )
  }
}

test('setState re-renders the subtree', async () => {
  const el = root()
  const box = render(h(Box, { label: 'a' }), el).comp as Box
  assert.equal(el.querySelector('span')!.textContent, 'a:0')

  box.setState({ n: 1 })
  await tick()
  assert.equal(el.querySelector('span')!.textContent, 'a:1')
})

test('setState rebuilds nodes rather than diffing them', async () => {
  // これは意図した割り切り。DOM の同一性が要る要素（video, input, 進行中の transition）は
  // setState するスライドに置かない。置きたくなったら差分適用を戻すこと。
  const el = root()
  const box = render(h(Box, { label: 'a' }), el).comp as Box
  const img = el.querySelector('img')

  box.setState({ n: 1 })
  await tick()
  assert.notEqual(el.querySelector('img'), img)
})

test('a child can appear and disappear without disturbing its siblings', async () => {
  const el = root()
  const box = render(h(Box, { label: 'a' }), el).comp as Box
  assert.equal(el.querySelector('p'), null)

  box.setState({ n: 1 })
  await tick()
  assert.equal(el.querySelector('p')!.textContent, 'extra')
  assert.equal(el.querySelector('span')!.textContent, 'a:1')

  box.setState({ n: 0 })
  await tick()
  assert.equal(el.querySelector('p'), null)
  assert.equal(el.querySelector('span')!.textContent, 'a:0')
})

test('handlers survive the rebuild they caused, and do not stack', async () => {
  class Counter extends Component<{}, { n: number }> {
    state = { n: 0 }
    render(): Child {
      return h('button', { onClick: () => this.setState((s) => ({ n: s.n + 1 })) }, String(this.state.n))
    }
  }
  const el = root()
  render(h(Counter, {}), el)
  for (let i = 0; i < 3; i++) {
    el.querySelector('button')!.dispatchEvent(new win.Event('click') as any)
    await tick()
  }
  // 毎回作り直されても、押した回数ぶんだけ増える（重複配線なら 7 になる）
  assert.equal(el.querySelector('button')!.textContent, '3')
})

test('lists shrink correctly and dropped props are gone', () => {
  const el = root()
  const list = (items: string[], cls?: string) => h('ul', { class: cls }, ...items.map((t) => h('li', {}, t)))

  render(list(['a', 'b', 'c'], 'x'), el)
  assert.equal(el.querySelectorAll('li').length, 3)
  assert.equal(el.querySelector('ul')!.getAttribute('class'), 'x')

  render(list(['a'], undefined), el)
  assert.equal(el.querySelectorAll('li').length, 1)
  assert.equal(el.querySelector('ul')!.hasAttribute('class'), false)
})

test('updated() fires after the DOM has been rebuilt, so focus can be restored', async () => {
  const el = root()
  const seen: string[] = []
  class Form extends Component<{}, { n: number }> {
    state = { n: 0 }
    updated() {
      // この時点で新しい DOM が入っていること
      seen.push(el.querySelector('span')!.textContent!)
    }
    render(): Child {
      return h('div', {}, h('input', {}), h('span', {}, String(this.state.n)))
    }
  }
  const form = render(h(Form, {}), el).comp as Form
  assert.deepEqual(seen, []) // 初回マウントでは呼ばれない

  form.setState({ n: 1 })
  await tick()
  assert.deepEqual(seen, ['1'])

  form.setState({ n: 2 })
  await tick()
  assert.deepEqual(seen, ['1', '2'])
})

test('unmounted() fires when a component leaves the tree', async () => {
  const el = root()
  const log: string[] = []
  class Timer extends Component<{}, {}> {
    mounted() {
      log.push('in')
    }
    unmounted() {
      log.push('out')
    }
    render(): Child {
      return h('i', {}, 'tick')
    }
  }
  class Host extends Component<{}, { show: boolean }> {
    state = { show: true }
    render(): Child {
      return h('div', {}, this.state.show ? h(Timer, {}) : null)
    }
  }
  const host = render(h(Host, {}), el).comp as Host
  await tick()
  assert.deepEqual(log, ['in'])

  host.setState({ show: false })
  await tick()
  assert.deepEqual(log, ['in', 'out'])
  assert.equal(el.querySelector('i'), null)
})
