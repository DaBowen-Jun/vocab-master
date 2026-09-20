import { STAGE_META, type Stage, type Word } from '../lib/types'
import { HomeIcon, HeadphonesIcon, PenIcon, BookIcon, ChartIcon, PlanetMark } from './icons'

const NAV_ITEMS: { key: string; label: string; icon: (p: { className?: string }) => JSX.Element }[] = [
  { key: 'home', label: '首页', icon: HomeIcon },
  { key: 'learn', label: '学习', icon: HeadphonesIcon },
  { key: 'exam', label: '考试', icon: PenIcon },
  { key: 'book', label: '词卡', icon: BookIcon },
  { key: 'stats', label: '统计', icon: ChartIcon },
]

/** 顶部品牌栏：图标在上、名称在下（上下结构，移动端更省横向空间） */
export function TopBar({ subtitle }: { subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-white/85 border-b border-slate-100">
      <div className="mx-auto max-w-3xl px-3 flex items-center justify-center h-16">
        <div className="flex flex-col items-center gap-0.5">
          <PlanetMark className="w-7 h-7" />
          <span className="font-display font-extrabold text-brand-600 text-[13px] leading-none">
            {subtitle || '词力星球'}
          </span>
        </div>
      </div>
    </header>
  )
}

/** 底部 Tab Bar：图标在上、文字在下（移动端标准上下结构） */
export function TabBar({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-slate-100 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl flex">
        {NAV_ITEMS.map((it) => {
          const Icon = it.icon
          const on = active === it.key
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              aria-current={on ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition ${
                on ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <span
                className={`flex items-center justify-center w-9 h-6 rounded-full transition ${
                  on ? 'bg-brand-50' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span className={`text-[10px] leading-none ${on ? 'font-bold' : 'font-medium'}`}>
                {it.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/** 高频等级星标：level 3=★★★ */
export function StarRating({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="text-amber-400 text-sm tracking-tight" title={`高频等级 ${'★'.repeat(level)}`}>
      {'★'.repeat(level)}
      <span className="text-slate-200">{'★'.repeat(3 - level)}</span>
    </span>
  )
}

/** 熟练度：百分比 + 进度条 双重呈现 */
export function ProficiencyBar({ value, showText = true }: { value: number; showText?: boolean }) {
  const color = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      {showText && (
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {value}%
        </span>
      )}
    </div>
  )
}

export function StageTag({ stage }: { stage: Stage }) {
  const m = STAGE_META[stage]
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold text-white"
      style={{ background: m.color }}
      title={m.label}
    >
      {m.short}
    </span>
  )
}

/** 学段切换器：全部 / 一级 / 二级 / 三级 / 必修 / 选必 / 选修 */
export function StageSwitch({ value, onChange }: { value: Stage | 'all'; onChange: (s: Stage | 'all') => void }) {
  const opts: { k: Stage | 'all'; l: string }[] = [
    { k: 'all', l: '全部' },
    { k: 'primary', l: '小学' },
    { k: 'junior', l: '中学' },
    { k: 'senior', l: '高中' },
    { k: 'college', l: '大学' },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => (
        <button
          key={o.k}
          className={`btn ${value === o.k ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onChange(o.k)}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

export function WordBrief({ word }: { word: Word }) {
  return (
    <div className="flex items-center gap-2">
      <StageTag stage={word.stage} />
      <div className="min-w-0">
        <div className="font-semibold leading-tight truncate">{word.term}</div>
        <div className="text-xs text-slate-400 truncate">{word.meaning}</div>
      </div>
      <StarRating level={word.level} />
    </div>
  )
}
