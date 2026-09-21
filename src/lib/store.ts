import type { Mastery, Milestone, UserProgress, Word } from './types'
import type { StageFilter } from './stageContext'
import { STAGE_ORDER } from './types'
import { MILESTONES, TITLES } from '../data/milestones'
import { WORDS, recitationWordsByStage } from '../data/words'

const STORAGE_KEY = 'vocab-master-progress-v1'

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function defaultProgress(): UserProgress {
  return {
    points: 0,
    streak: 0,
    checkIns: [],
    unlockedMilestones: [],
    title: TITLES[0].title,
    mastery: {},
  }
}

function load(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    return { ...defaultProgress(), ...JSON.parse(raw) }
  } catch {
    return defaultProgress()
  }
}

// ---- 单例 store（基于 useSyncExternalStore） ----
let state: UserProgress = load()
const listeners = new Set<() => void>()

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach((l) => l())
}

function setState(next: UserProgress) {
  state = next
  persist()
}

function getTitle(points: number): string {
  let t = TITLES[0].title
  for (const item of TITLES) if (points >= item.min) t = item.title
  return t
}

function evaluateMilestones(p: UserProgress): UserProgress {
  const totalWords = Object.keys(p.mastery).length
  const mastered = Object.values(p.mastery).filter((m) => m.proficiency >= 80).length
  let points = p.points
  const unlocked = [...p.unlockedMilestones]
  for (const m of MILESTONES) {
    if (unlocked.includes(m.id)) continue
    let ok = false
    switch (m.target.kind) {
      case 'totalWords':
        ok = totalWords >= m.target.value
        break
      case 'streak':
        ok = p.streak >= m.target.value
        break
      case 'points':
        ok = p.points >= m.target.value
        break
      case 'mastered':
        ok = mastered >= m.target.value
        break
    }
    if (ok && m.reward > 0) points += m.reward
    if (ok) unlocked.push(m.id)
  }
  return { ...p, points, unlockedMilestones: unlocked, title: getTitle(points) }
}

// ---- 公开 API ----
export const store = {
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  getSnapshot(): UserProgress {
    return state
  },

  /** 每日打卡（同一天重复点击不累加） */
  checkIn(): { streak: number; isNew: boolean } {
    const today = todayStr()
    if (state.checkIns.includes(today)) return { streak: state.streak, isNew: false }
    let streak = 1
    if (state.lastCheckIn) {
      const d = diffDays(state.lastCheckIn, today)
      streak = d === 1 ? state.streak + 1 : 1
    }
    let next = evaluateMilestones({
      ...state,
      streak,
      lastCheckIn: today,
      checkIns: [...state.checkIns, today],
    })
    // 打卡给基础积分
    next = { ...next, points: next.points + 5 }
    next = evaluateMilestones(next)
    setState(next)
    return { streak, isNew: true }
  },

  /**
   * 记录一次练习/考试结果，更新熟练度、积分与里程碑。
   * @param wordId 单词 id
   * @param correct 本次是否正确
   * @param timeMs 本次作答耗时（毫秒）
   * @param basePoint 基础积分（练习=5，考试题=10）
   */
  recordResult(wordId: string, correct: boolean, timeMs: number, basePoint = 5) {
    const prev: Mastery = state.mastery[wordId] ?? {
      wordId,
      proficiency: 0,
      totalTime: 0,
      attempts: 0,
      correct: 0,
    }
    const attempts = prev.attempts + 1
    const correctCount = prev.correct + (correct ? 1 : 0)
    const totalTime = prev.totalTime + timeMs
    const accuracy = correctCount / attempts
    const avgTime = totalTime / attempts
    // 速度因子：平均作答越快，熟练度加成越高
    const speedBonus = avgTime <= 6000 ? 8 : avgTime <= 12000 ? 0 : -8
    const raw = 0.5 * prev.proficiency + 0.5 * (accuracy * 100) + speedBonus
    const proficiency = Math.max(0, Math.min(100, Math.round(raw)))
    let next = evaluateMilestones({
      ...state,
      points: state.points + (correct ? basePoint : 0),
      mastery: {
        ...state.mastery,
        [wordId]: {
          wordId,
          proficiency,
          totalTime,
          attempts,
          correct: correctCount,
          lastReviewed: todayStr(),
        },
      },
    })
    setState(next)
  },

  /** 熟练度（无记录记 0） */
  proficiencyOf(wordId: string): number {
    return state.mastery[wordId]?.proficiency ?? 0
  },

  /** 按熟练度从低到高排序（优先复习薄弱词），可指定学段 */
  weakFirst(stage: StageFilter = 'all'): Word[] {
    const list = stage === 'all' ? WORDS : WORDS.filter((w) => w.stage === stage)
    return [...list].sort((a, b) => this.proficiencyOf(a.id) - this.proficiencyOf(b.id))
  },

  /** 按使用频次从高频到低频排序（默认学习顺序），可指定学段 */
  freqFirst(stage: StageFilter = 'all'): Word[] {
    const list = stage === 'all' ? WORDS : WORDS.filter((w) => w.stage === stage)
    return [...list].sort((a, b) => a.freq - b.freq)
  },

  /** 按教材单元顺序（unit1,2,3…）排序，用于背诵；未匹配单元的词排在学段末尾 */
  unitOrder(stage: StageFilter = 'all'): Word[] {
    if (stage === 'all') return STAGE_ORDER.flatMap((s) => recitationWordsByStage(s))
    return recitationWordsByStage(stage)
  },

  masteredCount(): number {
    return Object.values(state.mastery).filter((m) => m.proficiency >= 80).length
  },

  /** 重置全部进度 */
  reset() {
    setState(defaultProgress())
  },
}

export type Store = typeof store

export function milestoneMet(m: Milestone, p: UserProgress): boolean {
  return p.unlockedMilestones.includes(m.id)
}
