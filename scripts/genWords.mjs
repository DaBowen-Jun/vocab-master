// 词库生成器：读取 scripts/raw/<stage>.json（手写词表），
// 调用 freeDictionaryAPI 自动补全音标与英文例句，写出 src/data/words<STAGE>.ts
// 用法：node scripts/genWords.mjs g1
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const stage = process.argv[2]
if (!stage) {
  console.error('用法: node scripts/genWords.mjs <stage>  e.g. g1')
  process.exit(1)
}

// 读取原始词表：优先 raw/<stage>.json；否则合并 raw/<stage>/*.json 分片（绕过单次写入上限）
const single = join(__dirname, 'raw', `${stage}.json`)
const rawAll = []
if (existsSync(single)) {
  rawAll.push(...JSON.parse(readFileSync(single, 'utf8')))
} else {
  const dir = join(__dirname, 'raw', stage)
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    rawAll.push(...JSON.parse(readFileSync(join(dir, f), 'utf8')))
  }
}
// 按 term 去重并合并 usage（避免重复卡片/重复 id，同时保留多义项的说明）
const seen = new Map()
for (const w of rawAll) {
  const ex = seen.get(w.term)
  if (!ex) seen.set(w.term, { ...w })
  else if (w.usage) ex.usage = (ex.usage ? ex.usage + ' ' : '') + w.usage
}
const raw = [...seen.values()]
const API = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const OFFLINE = process.argv.includes('--offline')

async function fetchOne(term, attempt = 0) {
  if (OFFLINE) return null // 离线模式：跳过 API，音标/例句交由运行时在线补全
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(API + encodeURIComponent(term), {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'vocab-master/1.0 (+https://example.com)' },
    })
    if (res.status === 429 && attempt < 5) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      return fetchOne(term, attempt + 1)
    }
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) return null
    const e = data[0]
    let phonetic = e.phonetic
    if (!phonetic && Array.isArray(e.phonetics)) phonetic = e.phonetics.find((p) => p && p.text)?.text
    const examples = []
    for (const m of e.meanings || []) {
      for (const d of m.definitions || []) {
        if (d?.example && examples.length < 2) examples.push({ en: d.example, zh: '' })
      }
    }
    return { phonetic: phonetic || '', examples }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const conc = 2
  const queue = [...raw]
  const results = new Map() // term -> enriched
  let done = 0
  async function worker() {
    while (queue.length) {
      const w = queue.shift()
      const r = await fetchOne(w.term)
      await new Promise((res) => setTimeout(res, 500))
      results.set(w.term, {
        id: `${stage}-${slug(w.term)}`,
        term: w.term,
        phonetic: r?.phonetic || w.phonetic || '',
        meaning: w.meaning,
        level: w.level,
        stage,
        pos: w.pos || '',
        usage: w.usage || '',
        examples: r?.examples || [],
      })
      done++
      process.stdout.write(`\r${done}/${raw.length}`)
    }
  }
  await Promise.all(Array.from({ length: conc }, worker))
  const final = raw.map((w) => results.get(w.term))
  const body = final.map((o) => `  ${JSON.stringify(o)},`).join('\n')
  const ts =
    `import type { Word } from '../lib/types'\n\n` +
    `// ${stage.toUpperCase()} 学段词库（由 scripts/genWords.mjs 生成；音标/例句来自 freeDictionaryAPI，\n` +
    `// usage/释义为离线兜底，在线时由 wordSource.ts 自动增强）\n` +
    `export const ${stage.toUpperCase()}: Omit<Word, 'freq'>[] = [\n${body}\n]\n`
  writeFileSync(join(__dirname, '..', 'src', 'data', `words${stage.toUpperCase()}.ts`), ts, 'utf8')
  console.log(`\n✓ 写出 src/data/words${stage.toUpperCase()}.ts（${final.length} 词）`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
