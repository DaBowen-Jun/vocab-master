// 学段重构：把原 6 段（一级/二级/三级/必修/选必/选修）重组为 4 段
//   小学 primary ← 原一级 + 二级
//   中学 junior  ← 原三级（初中）
//   高中 senior  ← 原必修 + 选必 + 选修
//   大学 college ← 新增，取自 KyleBing 考研词表
// 用法：node scripts/restage.mjs
import fs from 'fs'

const COLLEGE_LIMIT = 1500
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')

// 数据文件每行是一个完整 JSON 对象，直接逐行 parse（比正则更可靠）
function parseFile(f) {
  const txt = fs.readFileSync('src/data/' + f, 'utf8')
  const out = []
  for (const line of txt.split('\n')) {
    const s = line.trim().replace(/,$/, '')
    if (!s.startsWith('{') || !s.endsWith('}')) continue
    try {
      out.push(JSON.parse(s))
    } catch {
      /* 跳过非数据行 */
    }
  }
  return out
}

// KyleBing 格式：单词\t释义
function parseKb(file) {
  return fs
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
}

const posOf = (m) => {
  const mm = m.match(/^([a-z]{1,5}\.)/)
  return mm ? mm[1] : ''
}

function dedupe(list) {
  const seen = new Set()
  const out = []
  for (const w of list) {
    const k = (w.term || '').toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(w)
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
  const CHUNK = 400 // 单条数组字面量过大会触发 TS2590
  const chunks = []
  for (let i = 0; i < lines.length; i += CHUNK) chunks.push(lines.slice(i, i + CHUNK))
  const blocks = chunks.map((c, i) => `const P${i + 1}: Item[] = [\n${c.join(',\n')},\n]`).join('\n\n')
  const spread = chunks.map((_, i) => `  ...P${i + 1}`).join(',\n')
  const out = `import type { Word } from '../lib/types'

// ${comment}
// 由 scripts/restage.mjs 生成。
type Item = Omit<Word, 'freq'>

${blocks}

export const ${exportName}: Item[] = [
${spread},
]
`
  fs.writeFileSync('src/data/' + file, out, 'utf8')
}

// --- 小学：一级 + 二级 ---
const primary = dedupe([...parseFile('wordsG1.ts'), ...parseFile('wordsG2.ts')]).map((w) => ({
  ...w,
  stage: 'primary',
}))
write('wordsPrimary.ts', 'PRIMARY', primary, 'primary', '小学词库（原一级 + 二级合并）。')

// --- 中学：三级（初中） ---
const junior = dedupe(parseFile('wordsG3.ts')).map((w) => ({ ...w, stage: 'junior' }))
write('wordsJunior.ts', 'JUNIOR', junior, 'junior', '中学（初中）词库，含中考核心词表。')

// --- 高中：必修 + 选必 + 选修 ---
const senior = dedupe([
  ...parseFile('wordsReq.ts'),
  ...parseFile('wordsSel.ts'),
  ...parseFile('wordsAdv.ts'),
]).map((w) => ({ ...w, stage: 'senior' }))
write('wordsSenior.ts', 'SENIOR', senior, 'senior', '高中词库（原必修 + 选必 + 选修合并）。')

// --- 大学：考研词表补充（排除已收录） ---
const taken = new Set()
for (const w of [...primary, ...junior, ...senior]) taken.add(w.term.toLowerCase())
const college = []
for (const it of parseKb('kb_kaoyan.txt')) {
  if (college.length >= COLLEGE_LIMIT) break
  const k = it.term.toLowerCase()
  if (taken.has(k)) continue
  taken.add(k)
  college.push({
    id: 'college-' + slug(it.term),
    term: it.term,
    phonetic: '',
    meaning: it.meaning,
    level: 1,
    stage: 'college',
    pos: posOf(it.meaning),
    usage: '',
    examples: [],
  })
}
write('wordsCollege.ts', 'COLLEGE', college, 'college', '大学词库（取自考研词表，补充更高阶词汇）。')

console.log(`小学 primary: ${primary.length}`)
console.log(`中学 junior: ${junior.length}`)
console.log(`高中 senior: ${senior.length}`)
console.log(`大学 college: ${college.length}`)
console.log(`合计: ${primary.length + junior.length + senior.length + college.length}`)
