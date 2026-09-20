import { useState } from 'react'
import { store, milestoneMet } from '../lib/store'
import { useProgress } from '../lib/useProgress'
import { MILESTONES } from '../data/milestones'
import { WORDS } from '../data/words'
import { useStage } from '../lib/stageContext'
import { STAGE_META, type Stage } from '../lib/types'
import { HeadphonesIcon, PenIcon, BookIcon, FlameIcon, TrophyIcon, StarIcon, TargetIcon, RocketIcon } from '../components/icons'
import type { MilestoneIconKey } from '../data/milestones'

const MILESTONE_ICONS: Record<MilestoneIconKey, (p: { className?: string }) => JSX.Element> = {
  star: StarIcon,
  book: BookIcon,
  trophy: TrophyIcon,
  flame: FlameIcon,
  rocket: RocketIcon,
  target: TargetIcon,
}

function lastNDays(n: number): string[] {
  const arr: string[] = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d)
    x.setDate(d.getDate() - i)
    arr.push(x.toISOString().slice(0, 10))
  }
  return arr
}

const STAGE_LIST: Stage[] = ['primary', 'junior', 'senior', 'college']

export function Home({ onNavigate }: { onNavigate: (v: string) => void }) {
  const p = useProgress()
  const { setStage } = useStage()
  const [toast, setToast] = useState('')
  const days = lastNDays(7)

  const doCheckIn = () => {
    const r = store.checkIn()
    if (r.isNew) setToast(`打卡成功！连续 ${r.streak} 天，+5 积分`)
    else setToast('今天已经打卡啦～')
    setTimeout(() => setToast(''), 2200)
  }

  const enterStage = (s: Stage) => {
    setStage(s)
    onNavigate('learn')
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-brand-600 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-1">
          <FlameIcon className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* 个人信息条 */}
      <div className="card p-4 flex items-center justify-between bg-gradient-to-r from-brand-500 to-brand-600 text-white">
        <div>
          <div className="text-sm opacity-80">你好，小宇航员</div>
          <div className="text-lg font-extrabold">称号：{p.title}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black leading-none">{p.points}</div>
          <div className="text-xs opacity-80">积分</div>
        </div>
      </div>

      {/* 针对性背诵：三学段入口 */}
      <div className="card p-4">
        <div className="font-bold mb-1">选择学段，针对性背诵</div>
        <div className="text-xs text-slate-400 mb-3">选定学段后，学习 / 词卡 / 考试 / 统计将仅围绕该学段内容。</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STAGE_LIST.map((s) => {
            const m = STAGE_META[s]
            const count = WORDS.filter((w) => w.stage === s).length
            const mastered = WORDS.filter((w) => w.stage === s && store.proficiencyOf(w.id) >= 80).length
            return (
              <button
                key={s}
                onClick={() => enterStage(s)}
                className="rounded-2xl p-3 bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-100 transition active:scale-95 text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                    style={{ background: m.color }}
                  >
                    {m.short}
                  </span>
                  <span className="text-base font-extrabold text-slate-700">{m.label}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  已收录 {count} 词 · 已掌握 {mastered}
                </div>
                <div className="text-[11px] text-slate-300">课标参考 {m.target} 词</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 每日打卡 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">每日打卡</div>
          <div className="text-sm text-slate-500">
            连续 <span className="text-brand-600 font-bold text-lg">{p.streak}</span> 天
          </div>
        </div>
        <div className="flex justify-between gap-1.5 mb-3">
          {days.map((d) => {
            const done = p.checkIns.includes(d)
            const week = ['日', '一', '二', '三', '四', '五', '六'][new Date(d).getDay()]
            const isToday = d === days[days.length - 1]
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                    done ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'
                  } ${isToday && !done ? 'ring-2 ring-brand-300 ring-offset-1' : ''} ${
                    isToday && done ? 'ring-2 ring-brand-200 ring-offset-1' : ''
                  }`}
                >
                  {done ? '✓' : week}
                </div>
                <span
                  className={`text-[10px] ${isToday ? 'text-brand-600 font-bold' : 'text-slate-400'}`}
                >
                  周{week}
                </span>
              </div>
            )
          })}
        </div>
        <button className="btn-primary w-full" onClick={doCheckIn}>
          {p.checkIns.includes(new Date().toISOString().slice(0, 10)) ? '已打卡（明日再来）' : '今日打卡 +5 积分'}
        </button>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: HeadphonesIcon, label: '跟读 / 拼写', to: 'learn' },
          { icon: PenIcon, label: '中英考试', to: 'exam' },
          { icon: BookIcon, label: '词卡本', to: 'book' },
        ].map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.to}
              className="card p-3 flex flex-col items-center gap-2 hover:border-brand-100 hover:shadow-md transition cursor-pointer"
              onClick={() => onNavigate(a.to)}
            >
              <span className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center">
                <Icon className="w-6 h-6 text-brand-500" />
              </span>
              <span className="text-xs font-semibold text-slate-600">{a.label}</span>
            </button>
          )
        })}
      </div>

      {/* 里程碑成就 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">里程碑成就</div>
          <span className="text-xs text-slate-400">
            {p.unlockedMilestones.length}/{MILESTONES.length}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MILESTONES.map((m) => {
            const met = milestoneMet(m, p)
            return (
              <div
                key={m.id}
                className={`rounded-xl p-2.5 text-center border ${
                  met ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100 opacity-70'
                }`}
              >
                <div className="flex justify-center" style={{ filter: met ? 'none' : 'grayscale(1)' }}>
                  {(() => {
                    const Icon = MILESTONE_ICONS[m.icon]
                    return <Icon className="w-7 h-7 text-amber-500" />
                  })()}
                </div>
                <div className="text-xs font-bold mt-1">{m.title}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{m.desc}</div>
                {met && m.reward > 0 && (
                  <div className="text-[10px] text-amber-600 font-semibold mt-0.5">+{m.reward} 积分</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button className="btn-ghost w-full" onClick={() => onNavigate('map')}>
        查看产品功能结构图 →
      </button>
    </div>
  )
}
