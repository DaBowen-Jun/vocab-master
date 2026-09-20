// 全局类型定义

// 学段按「小学 / 中学（初中）/ 高中 / 大学」四个阶段划分：
//   小学 = 原一级 + 二级；中学 = 原三级（初中）；高中 = 原必修 + 选必 + 选修；大学 = 四六级/考研层级
export type Stage = 'primary' | 'junior' | 'senior' | 'college'

// target = 该阶段对应的「累计词汇量要求」（课标口径，越小越基础）
export const STAGE_META: Record<
  Stage,
  { label: string; full: string; short: string; color: string; target: number; order: number }
> = {
  primary: { label: '小学', full: '小学 · 一~六年级', short: '小', color: '#22c55e', target: 800, order: 1 },
  junior: { label: '中学', full: '初中 · 七~九年级', short: '中', color: '#f59e0b', target: 1600, order: 2 },
  senior: { label: '高中', full: '高中 · 必修+选必+选修', short: '高', color: '#6366f1', target: 3500, order: 3 },
  college: { label: '大学', full: '大学 · 四六级/考研', short: '大', color: '#8b5cf6', target: 6000, order: 4 },
}

// 按学习顺序的学段列表
export const STAGE_ORDER: Stage[] = ['primary', 'junior', 'senior', 'college']

export interface Example {
  en: string
  zh: string
}

export interface Word {
  id: string
  term: string // 英文单词 / 词组
  phonetic: string // 音标
  meaning: string // 中文释义
  level: 1 | 2 | 3 // 高频等级：★★★=3, ★★=2, ★=1
  stage: Stage
  pos: string // 词性，如 n. / v.
  usage: string // 用法说明
  examples: Example[]
  freq: number // 全局使用频次排名（越小越常用），用于按频次给出学习顺序
}

/** 单个单词的掌握度记录 */
export interface Mastery {
  wordId: string
  proficiency: number // 0-100 熟练度
  totalTime: number // 累计作答耗时（毫秒）
  attempts: number // 练习/考试次数
  correct: number // 正确次数
  lastReviewed?: string // 最近复习日期 yyyy-mm-dd
}

/** 里程碑达成条件类型 */
export type MilestoneTarget =
  | { kind: 'totalWords'; value: number } // 累计学习单词数（至少练过一次）
  | { kind: 'streak'; value: number } // 连续打卡天数
  | { kind: 'points'; value: number } // 累计积分
  | { kind: 'mastered'; value: number } // 熟练度 >= 80 的单词数

/** 里程碑图标键（对应 icons.tsx 中的 Lucide 风格 SVG 组件） */
export type MilestoneIconKey = 'star' | 'book' | 'trophy' | 'flame' | 'rocket' | 'target'

export interface Milestone {
  id: string
  title: string
  desc: string
  icon: MilestoneIconKey // 用 SVG 图标（不使用 emoji）
  reward: number // 解锁奖励积分
  target: MilestoneTarget
}

/** 用户进度（持久化到 localStorage） */
export interface UserProgress {
  points: number
  streak: number
  lastCheckIn?: string // yyyy-mm-dd
  checkIns: string[] // 已打卡日期集合
  unlockedMilestones: string[]
  title: string // 当前称号
  mastery: Record<string, Mastery>
}
