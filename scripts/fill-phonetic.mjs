// 用 KyleBing sentence 版词表（含 us/uk 音标）回填各学段缺失的音标。
// 只补空值，已有音标的词条保持原样。
// 用法：node scripts/fill-phonetic.mjs
import fs from 'fs'

const SENT_FILES = [
  'kb_sent_junior.jsonl',
  'kb_sent_gaozhong.jsonl',
  'kb_sent_cet4.jsonl',
  'kb_sent_cet6.jsonl',
  'kb_sent_kaoyan.jsonl',
  'kb_sent_ielts.jsonl',
  'kb_sent_tem4.jsonl',
  'kb_sent_gmat.jsonl',
]

const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')

// 1) 建立 word -> 音标 映射（优先英音 uk，其次美音 us）
const PH = new Map()
for (const f of SENT_FILES) {
  const p = 'scripts/raw/' + f
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const s = line.trim()
    if (!s) continue
    let o
    try {
      o = JSON.parse(s)
    } catch {
      continue
    }
    const w = (o.word || '').trim().toLowerCase()
    const ph = o.uk || o.us
    if (!w || !ph) continue
    if (!PH.has(w)) PH.set(w, String(ph).trim())
  }
}
console.log('音标库可用词条:', PH.size)

// 统一为 /xxx/ 格式
const fmtPh = (p) => {
  const s = String(p).trim()
  if (!s) return ''
  return s.startsWith('/') && s.endsWith('/') ? s : '/' + s.replace(/^\/|\/$/g, '') + '/'
}

function parseFile(f) {
  const out = []
  for (const line of fs.readFileSync('src/data/' + f, 'utf8').split('\n')) {
    const s = line.trim().replace(/,$/, '')
    if (!s.startsWith('{') || !s.endsWith('}')) continue
    try {
      out.push(JSON.parse(s))
    } catch {
      /* skip */
    }
  }
  return out
}

function write(file, exportName, list, stage, comment) {
  const lines = list.map(
    (w) =>
      `  {"id":"${esc(w.id)}","term":"${esc(w.term)}","phonetic":"${esc(w.phonetic)}","meaning":"${esc(
        w.meaning
      )}","level":${w.level},"stage":"${stage}","pos":"${esc(w.pos)}","usage":"${esc(
        w.usage || ''
      )}","examples":[]}`
  )
  const CHUNK = 400 // 避免 TS2590
  const chunks = []
  for (let i = 0; i < lines.length; i += CHUNK) chunks.push(lines.slice(i, i + CHUNK))
  const blocks = chunks.map((c, i) => `const P${i + 1}: Item[] = [\n${c.join(',\n')},\n]`).join('\n\n')
  const spread = chunks.map((_, i) => `  ...P${i + 1}`).join(',\n')
  const out = `import type { Word } from '../lib/types'

// ${comment}
// 由 scripts/fill-phonetic.mjs 回填音标。
type Item = Omit<Word, 'freq'>

${blocks}

export const ${exportName}: Item[] = [
${spread},
]
`
  fs.writeFileSync('src/data/' + file, out, 'utf8')
}

const TARGETS = [
  { file: 'wordsPrimary.ts', exportName: 'PRIMARY', stage: 'primary', comment: '小学词库（原一级 + 二级合并）。' },
  { file: 'wordsJunior.ts', exportName: 'JUNIOR', stage: 'junior', comment: '中学（初中）词库，含中考核心词表。' },
  { file: 'wordsSenior.ts', exportName: 'SENIOR', stage: 'senior', comment: '高中词库（原必修 + 选必 + 选修合并）。' },
  { file: 'wordsCollege.ts', exportName: 'COLLEGE', stage: 'college', comment: '大学词库（取自考研词表，补充更高阶词汇）。' },
]

let missAll = 0
let fillAll = 0
for (const t of TARGETS) {
  const list = parseFile(t.file)
  let miss = 0
  let fill = 0
  for (const w of list) {
    if (w.phonetic && String(w.phonetic).trim()) continue
    miss++
    const ph = PH.get(String(w.term).toLowerCase())
    if (ph) {
      w.phonetic = fmtPh(ph)
      fill++
    }
  }
  write(t.file, t.exportName, list, t.stage, t.comment)
  missAll += miss
  fillAll += fill
  const withPh = list.filter((w) => w.phonetic && String(w.phonetic).trim()).length
  const pct = ((withPh / list.length) * 100).toFixed(1)
  console.log(`${t.stage}: 缺失 ${miss} → 补上 ${fill}，最终有音标 ${withPh}/${list.length} (${pct}%)`)
}
console.log(`---\n合计缺失 ${missAll}，补上 ${fillAll}，命中率 ${((fillAll / missAll) * 100).toFixed(1)}%`)
