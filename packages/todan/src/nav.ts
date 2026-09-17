export type Pos = [slide: number, step: number]
/** スライドごとの URL 名。未指定のスライドは添字で表す。 */
export type Paths = (string | undefined)[]

const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max)

/** 前後に1つ進む。端まで来たら隣のスライドへこぼれる。 */
export function advance([i, s]: Pos, dir: 1 | -1, steps: (i: number) => number, count: number): Pos {
  const next = s + dir
  if (next >= 0 && next < steps(i)) return [i, next]
  const ni = i + dir
  if (ni < 0 || ni >= count) return [i, s]
  return [ni, dir > 0 ? 0 : steps(ni) - 1]
}

/** `#intro.1` も `#0.1` も読む。名前が一致すればそれを優先。 */
export function parseHash(hash: string, paths: Paths, steps: (i: number) => number): Pos {
  const [token = '', rawStep] = hash.replace(/^#/, '').split('.')
  const named = paths.indexOf(token)
  const n = Number(token)
  const i = named >= 0 ? named : Number.isFinite(n) ? clamp(n, paths.length - 1) : 0
  const s = Number(rawStep)
  return [i, Number.isFinite(s) ? clamp(s, steps(i) - 1) : 0]
}

export const formatHash = ([i, s]: Pos, paths: Paths) => `#${paths[i] ?? i}` + (s ? `.${s}` : '')
