import type { Word, Stage } from '../lib/types'
import { WORD_FREQUENCY } from './frequency'
import { PRIMARY } from './wordsPrimary'
import { JUNIOR } from './wordsJunior'
import { SENIOR } from './wordsSenior'
import { COLLEGE } from './wordsCollege'

// 汇总 4 学段词库（小学 / 中学 / 高中 / 大学）
const RAW: Omit<Word, 'freq'>[] = [...PRIMARY, ...JUNIOR, ...SENIOR, ...COLLEGE]

// 学段基础排序值：保证 primary < junior < senior < college，
// 学段内优先按真实词频排序，未收录于词频源的词统一排在学段末尾。
const STAGE_FREQ_BASE: Record<Stage, number> = {
  primary: 0,
  junior: 10_000_000,
  senior: 20_000_000,
  college: 30_000_000,
}

// 同一个单词可能同时被多个学段收录（当前一级 / 二级存在 218 个重叠词）。
// 按「最低学段优先」去重：每个词只在它首次出现的学段保留一次，
// 避免重复背诵，也避免各学段「已收录」数量被重复计数。
const DEDUPED: Omit<Word, 'freq'>[] = []
const indexByTerm = new Map<string, number>()
for (const w of RAW) {
  const key = w.term.toLowerCase()
  const idx = indexByTerm.get(key)
  if (idx === undefined) {
    indexByTerm.set(key, DEDUPED.length)
    DEDUPED.push(w)
  } else if (STAGE_FREQ_BASE[w.stage] < STAGE_FREQ_BASE[DEDUPED[idx].stage]) {
    // 遇到学段更低的同名条目时，用更低学段的那条覆盖
    DEDUPED[idx] = w
  }
}

export const WORDS: Word[] = DEDUPED.map((w) => {
  const fr = WORD_FREQUENCY[w.term.toLowerCase()]
  const rank = typeof fr === 'number' ? fr : 9_000_000
  return { ...w, freq: STAGE_FREQ_BASE[w.stage] + rank }
}).sort((a, b) => a.freq - b.freq)

export const WORD_MAP: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.id, w]))

export function wordsByStage(stage: Stage): Word[] {
  return WORDS.filter((w) => w.stage === stage).sort((a, b) => a.freq - b.freq)
}
