// 一次性脚本：从真实词频数据集为词库单词生成精确频率排名，写入 src/data/frequency.ts
// 用法：node scripts/build-frequency.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const wordsPath = join(root, '..', 'src', 'data', 'words.ts')
const wordsSrc = readFileSync(wordsPath, 'utf8')
const terms = [...wordsSrc.matchAll(/term:\s*'([^']+)'/g)].map((m) => m[1])
console.log('terms found in words.ts:', terms.length)

// 真实词频数据集（按使用频率降序）：优先 50k 计数表（覆盖到极生僻词，排名最完整），其次 1 万词表
const urls = [
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/en/en_50k.txt',
  'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt',
]

async function fetchText(url) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 60000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

let text = null
import { existsSync } from 'node:fs'
const cacheFile = join(root, '_en50k.tmp')
if (existsSync(cacheFile)) {
  text = readFileSync(cacheFile, 'utf8')
  console.log('used local cache ->', cacheFile, '(chars:', text.length, ')')
} else {
  for (const u of urls) {
    try {
      text = await fetchText(u)
      console.log('fetched OK ->', u, '(chars:', text.length, ')')
      break
    } catch (e) {
      console.warn('fetch failed ->', u, e.message)
    }
  }
}
if (!text) {
  console.error('无法获取任何词频数据集，保留现有 frequency.ts。')
  process.exit(2)
}

const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
const rank = new Map()
lines.forEach((line, i) => {
  const word = line.split(/\s+/)[0].toLowerCase() // 兼容 "word count" / "word\tcount" 格式
  if (!rank.has(word)) rank.set(word, i + 1)
})

const out = []
let matched = 0
for (const t of terms) {
  const r = rank.get(t.toLowerCase())
  if (r) {
    out.push(`  '${t}': ${r},`)
    matched++
  }
}
console.log('terms with precise rank:', matched, '/', terms.length)

const header = `// 真实词频数据集（精确频率排名）
// ------------------------------------------------------------------
// 数据来源：Google Books / 语料库高频词表（google-10000-english，按真实使用频率降序）。
// 数值 = 该词在通用语料中的「全局频率排名」（1 = 最常用，越大越生僻）。
// 本文件由 scripts/build-frequency.mjs 从真实数据集自动生成，可随时换源重算。
//
// 换更精准的数据源（如 SUBTLEX 字幕语料 / 百万词频），只需修改脚本中的 urls 指向对应
// 词表（要求：按频率降序、每行一个词，或 "word<TAB>count" 格式），重新运行即可。
// 牛津 3000/5000 属「核心词表」而非连续频率，更适合做"是否核心词"标记，可与本排名并行使用。
//
// 多词词组（如 be used to / in view of）不在单字频率表中，由 words.ts 按学段兜底排名。

export const WORD_FREQUENCY: Record<string, number> = {
`
const footer = `}
`
writeFileSync(
  join(root, '..', 'src', 'data', 'frequency.ts'),
  header + out.join('\n') + '\n' + footer,
)
console.log('wrote src/data/frequency.ts')
