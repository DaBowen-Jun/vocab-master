// 由 KyleBing/english-vocabulary 分级词表生成高中三个学段词库：
//   必修 req ← 高中词表（6008）
//   选必 sel ← 四级词表（7508）
//   选修 adv ← 六级词表（5651）
// 源数据格式：每行 `单词\t释义`（无音标，音标交由运行时 API 补全）。
// 策略：先保留原有人工整理的核心词（含音标），再按 LIMIT 从分级词表补充"更低学段未收录"的新词。
// 用法：node scripts/build-high.mjs
import fs from 'fs'

const LIMIT = 1200 // 每个学段收录上限（超出课标新增量，保证充足练习量）

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')

// 词频（仅少量精选词，用于给部分词定级）
const freqTxt = fs.readFileSync('src/data/frequency.ts', 'utf8')
const FREQ = new Map()
for (const m of freqTxt.matchAll(/'([^']+)':\s*(\d+)/g)) FREQ.set(m[1].toLowerCase(), +m[2])
const levelOf = (t, def) => {
  const r = FREQ.get(t.toLowerCase())
  if (r === undefined) return def
  return r <= 2000 ? 3 : r <= 8000 ? 2 : 1
}

// 更低学段已收录的词（避免跨学段重复）
const taken = new Set()
for (const f of ['wordsG1.ts', 'wordsG2.ts', 'wordsG3.ts']) {
  const t = fs.readFileSync('src/data/' + f, 'utf8')
  for (const m of t.matchAll(/"term":"([^"]+)"/g)) taken.add(m[1].toLowerCase())
}

const parseKb = (file) =>
  fs
    .readFileSync('scripts/raw/' + file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      const i = l.indexOf('\t')
      if (i < 0) return null
      const term = l.slice(0, i).trim()
      const meaning = l.slice(i + 1).trim()
      if (!term || /\s/.test(term)) return null
      if (!/^[A-Za-z][A-Za-z'-]*$/.test(term)) return null
      return { term, meaning }
    })
    .filter(Boolean)

// 释义开头的词性，如 "n. 寝具" -> "n."
const posOf = (m) => {
  const mm = m.match(/^([a-z]{1,5}\.)/)
  return mm ? mm[1] : ''
}

// 读取该学段原有的人工词条（兼容压缩 JSON 行与对象两种写法）
function loadManual(file, stage) {
  const path = 'src/data/' + file
  if (!fs.existsSync(path)) return []
  const t = fs.readFileSync(path, 'utf8')
  const out = []
  const jsonRe = /\{"id":"([^"]*)","term":"([^"]*)","phonetic":"([^"]*)","meaning":"([^"]*)","level":(\d+),"stage":"[^"]*","pos":"([^"]*)"/g
  const objRe = /\{ id: '([^']*)', term: '([^']*)', phonetic: '([^']*)', meaning: '([^']*)', level: (\d+), stage: '[a-z]+', pos: '([^']*)'/g
  for (const m of t.matchAll(jsonRe)) {
    out.push({ id: m[1], term: m[2], phonetic: m[3], meaning: m[4], level: +m[5], stage, pos: m[6] })
  }
  for (const m of t.matchAll(objRe)) {
    out.push({ id: m[1], term: m[2], phonetic: m[3], meaning: m[4], level: +m[5], stage, pos: m[6] })
  }
  return out
}

function write(stage, exportName, file, list, comment) {
  const lines = list.map(
    (w) =>
      `  {"id":"${esc(w.id)}","term":"${esc(w.term)}","phonetic":"${esc(w.phonetic)}","meaning":"${esc(
        w.meaning
      )}","level":${w.level},"stage":"${stage}","pos":"${esc(w.pos)}","usage":"","examples":[]}`
  )
  // 分块：单条数组字面量过大会触发 TS2590
  const CHUNK = 400
  const chunks = []
  for (let i = 0; i < lines.length; i += CHUNK) chunks.push(lines.slice(i, i + CHUNK))
  const blocks = chunks.map((c, i) => `const P${i + 1}: Item[] = [\n${c.join(',\n')},\n]`).join('\n\n')
  const spread = chunks.map((_, i) => `  ...P${i + 1}`).join(',\n')
  const out = `import type { Word } from '../lib/types'

// ${comment}
// 数据源：KyleBing/english-vocabulary（${file} 对应的分级词表）
// 由 scripts/build-high.mjs 生成；音标缺失，交由运行时 API 联网补全。
type Item = Omit<Word, 'freq'>

${blocks}

export const ${exportName}: Item[] = [
${spread},
]
`
  fs.writeFileSync('src/data/' + file, out, 'utf8')
}

function build({ stage, exportName, file, src, comment, defaultLevel }) {
  const list = []
  const seen = new Set()
  const push = (w) => {
    const k = w.term.toLowerCase()
    if (seen.has(k) || taken.has(k)) return false
    seen.add(k)
    list.push(w)
    return true
  }

  // 1) 原有人工词条优先保留
  let manual = 0
  for (const w of loadManual(file, stage)) {
    if (push({ ...w, stage })) manual++
  }
  // 2) 从分级词表补充新词
  let added = 0
  for (const it of parseKb(src)) {
    if (list.length >= LIMIT) break
    const ok = push({
      id: `${stage}-${slug(it.term)}`,
      term: it.term,
      phonetic: '',
      meaning: it.meaning,
      level: levelOf(it.term, defaultLevel),
      stage,
      pos: posOf(it.meaning),
    })
    if (ok) added++
  }

  write(stage, exportName, file, list, comment)
  list.forEach((w) => taken.add(w.term.toLowerCase()))
  console.log(`${stage}（${exportName}）: 共 ${list.length} 词 = 保留人工 ${manual} + 新增 ${added}`)
}

build({
  stage: 'req',
  exportName: 'REQ',
  file: 'wordsReq.ts',
  src: 'kb_gaozhong.txt',
  comment: '必修（高中 · 必修）词库。',
  defaultLevel: 2,
})
build({
  stage: 'sel',
  exportName: 'SEL',
  file: 'wordsSel.ts',
  src: 'kb_cet4.txt',
  comment: '选必（高中 · 选择性必修）词库。',
  defaultLevel: 2,
})
build({
  stage: 'adv',
  exportName: 'ADV',
  file: 'wordsAdv.ts',
  src: 'kb_cet6.txt',
  comment: '选修（高中 · 选修（提高类））词库。',
  defaultLevel: 1,
})
