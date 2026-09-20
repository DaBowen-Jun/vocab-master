// 由中考核心词表生成三级（g3）词库：
//   源数据 scripts/raw/zhongkao_vocab_simple.json
//     （来自 https://github.com/jim-688/zhongkao-english-vocab，字段 word/phonetic/pos/meaning）
//   输出 src/data/wordsG3.ts
// 策略：只取纯单词（跳过短语）；中考词表优先，原人工整理的核心词作为补充保留。
// 用法：node scripts/build-g3.mjs
import fs from 'fs'

const RAW = 'scripts/raw/zhongkao_vocab_simple.json'
const OUT = 'src/data/wordsG3.ts'
const FREQ_FILE = 'src/data/frequency.ts'
const CUR_G3 = 'scripts/raw/g3-manual.ts' // 首次生成前的原人工整理版（对象写法）

const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// 高频等级：中考词表本身按「高频在前」排列（词频排序后每 500 词段内乱序），
// 因此直接用数组位次映射等级。
// 注意：src/data/frequency.ts 只覆盖约 88 个精选词，不足以给近 2000 个词条定级，故不采用。
const levelByIndex = (i) => (i < 600 ? 3 : i < 1300 ? 2 : 1)

// 音标：[fiːl] 或 [wɜːk] [wɜːrk] -> /fiːl/（取第一个，统一为项目使用的 /.../ 格式）
const phoneticOf = (p) => {
  if (!p) return ''
  const m = String(p).match(/\[[^\]]+\]/)
  return m ? m[0].replace('[', '/').replace(']', '/') : ''
}

const seen = new Map()
let fromZhongkao = 0
let fromManual = 0
let skippedPhrase = 0

const add = (w, source) => {
  const key = w.term.toLowerCase()
  if (seen.has(key)) return
  seen.set(key, w)
  if (source === 'zk') fromZhongkao++
  else fromManual++
}

// 1) 中考核心词表（纯单词）
const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'))
raw.forEach((it, i) => {
  const term = (it.word || '').trim()
  if (!term) return
  if (/\s/.test(term)) {
    skippedPhrase++
    return
  }
  if (!/^[A-Za-z][A-Za-z'-]*$/.test(term)) return
  add(
    {
      id: 'g3-' + slug(term),
      term,
      phonetic: phoneticOf(it.phonetic),
      meaning: (it.meaning || '').trim(),
      level: levelByIndex(i),
      stage: 'g3',
      pos: it.pos ? `${it.pos}.` : '',
      usage: '',
      examples: [],
    },
    'zk'
  )
})

// 2) 原有人工整理的核心词（中考表未覆盖的才保留）
const cur = fs.existsSync(CUR_G3) ? fs.readFileSync(CUR_G3, 'utf8') : ''
const re = /\{ id: '([^']*)', term: '([^']*)', phonetic: '([^']*)', meaning: '([^']*)', level: (\d), stage: 'g3', pos: '([^']*)'/g
let curCount = 0
for (const m of cur.matchAll(re)) {
  curCount++
  const term = m[2]
  if (!term || /\s/.test(term)) continue
  add(
    {
      id: m[1] || 'g3-' + slug(term),
      term,
      phonetic: m[3] || '',
      meaning: m[4] || '',
      level: Number(m[5]) || 1,
      stage: 'g3',
      pos: m[6] || '',
      usage: '',
      examples: [],
    },
    'manual'
  )
}

const list = [...seen.values()]
const lines = list.map(
  (w) =>
    `  {"id":"${esc(w.id)}","term":"${esc(w.term)}","phonetic":"${esc(w.phonetic)}","meaning":"${esc(
      w.meaning
    )}","level":${w.level},"stage":"g3","pos":"${esc(w.pos)}","usage":"","examples":[]}`
)

// 分块声明：单条数组字面量过大会触发 TS2590（联合类型过于复杂），
// 因此按 CHUNK 条一块分别声明为 Item[]，最后再合并导出。
const CHUNK = 400
const chunks = []
for (let i = 0; i < lines.length; i += CHUNK) chunks.push(lines.slice(i, i + CHUNK))
const blocks = chunks
  .map((c, i) => `const P${i + 1}: Item[] = [\n${c.join(',\n')},\n]`)
  .join('\n\n')
const spread = chunks.map((_, i) => `  ...P${i + 1}`).join(',\n')

const out = `import type { Word } from '../lib/types'

// 三级（初中 · 七~九年级）词库。
// 由中考核心词表（scripts/raw/zhongkao_vocab_simple.json，来源 jim-688/zhongkao-english-vocab）
// 经 scripts/build-g3.mjs 生成，并合并原有人工整理的核心词。
// 音标来自词表，例句/用法联网由 API 补齐。
type Item = Omit<Word, 'freq'>

${blocks}

export const G3: Item[] = [
${spread},
]
`
fs.writeFileSync(OUT, out, 'utf8')

const lv = { 1: 0, 2: 0, 3: 0 }
list.forEach((w) => (lv[w.level] = (lv[w.level] || 0) + 1))
console.log(`中考表词条: ${raw.length}，跳过短语: ${skippedPhrase}`)
console.log(`原有 g3 人工词条: ${curCount}`)
console.log(`生成 g3 总计: ${list.length}（来自中考表 ${fromZhongkao}，保留人工 ${fromManual}）`)
console.log(`高频等级分布: ★★★ ${lv[3]} / ★★ ${lv[2]} / ★ ${lv[1]}`)
