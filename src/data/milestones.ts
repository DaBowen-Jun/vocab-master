import type { Milestone, MilestoneIconKey } from '../lib/types'

export type { MilestoneIconKey }

// 里程碑（成就）定义。condition 在 store 中按 target 评估。
export const MILESTONES: Milestone[] = [
  {
    id: 'm-first-word',
    title: '初出茅庐',
    desc: '累计学习 1 个单词',
    icon: 'star',
    reward: 10,
    target: { kind: 'totalWords', value: 1 },
  },
  {
    id: 'm-10-words',
    title: '小有积累',
    desc: '累计学习 10 个单词',
    icon: 'book',
    reward: 30,
    target: { kind: 'totalWords', value: 10 },
  },
  {
    id: 'm-500-words',
    title: '词汇达人',
    desc: '累计记忆 500 个单词',
    icon: 'trophy',
    reward: 200,
    target: { kind: 'totalWords', value: 500 },
  },
  {
    id: 'm-streak-7',
    title: '坚持不懈',
    desc: '连续打卡 7 天',
    icon: 'flame',
    reward: 50,
    target: { kind: 'streak', value: 7 },
  },
  {
    id: 'm-streak-30',
    title: '月度学霸',
    desc: '连续打卡 30 天',
    icon: 'rocket',
    reward: 300,
    target: { kind: 'streak', value: 30 },
  },
  {
    id: 'm-points-500',
    title: '积分富翁',
    desc: '累计获得 500 积分',
    icon: 'star',
    reward: 0,
    target: { kind: 'points', value: 500 },
  },
  {
    id: 'm-mastered-5',
    title: '稳操胜券',
    desc: '熟练度达 80% 的单词 ≥ 5 个',
    icon: 'target',
    reward: 80,
    target: { kind: 'mastered', value: 5 },
  },
]

// 称号：按累计积分自动授予，越高越稀有。
export const TITLES: { min: number; title: string }[] = [
  { min: 0, title: '单词萌新' },
  { min: 100, title: '背词新星' },
  { min: 300, title: '词汇骑士' },
  { min: 600, title: '记忆大师' },
  { min: 1200, title: '词力星神' },
]
