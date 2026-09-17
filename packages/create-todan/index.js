#!/usr/bin/env node
import { cp, readFile, writeFile, readdir, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const { version } = JSON.parse(await readFile(join(HERE, 'package.json'), 'utf8'))

const target = resolve(process.argv[2] ?? 'my-deck')
const name = basename(target)

if (existsSync(target) && (await readdir(target)).length > 0) {
  console.error(`${target} が空ではありません。別の名前を指定してください。`)
  process.exit(1)
}

// テンプレートはリポジトリ内で開発用デッキも兼ねているので、作業生成物は持ち込まない。
const SKIP = new Set(['node_modules', 'dist', '.vite', '.DS_Store'])
await cp(join(HERE, 'template'), target, {
  recursive: true,
  filter: (src) => !SKIP.has(basename(src)),
})

// npm は公開時に .gitignore を .npmignore に読み替えて配布物から落とすので、
// テンプレートでは _gitignore として持ち、ここで戻す。
const dotless = join(target, '_gitignore')
if (existsSync(dotless)) await rename(dotless, join(target, '.gitignore'))

// テンプレート内では workspace 参照。作られたプロジェクトでは公開版を指す。
const pkgPath = join(target, 'package.json')
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
pkg.name = name
pkg.dependencies.todan = `^${version}`
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`
  ${name} を作りました。

    cd ${name}
    npm install
    npm run dev
`)
