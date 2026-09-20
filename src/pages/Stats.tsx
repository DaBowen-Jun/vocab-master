import { useMemo } from 'react'
import { store } from '../lib/store'
import { useProgress } from '../lib/useProgress'
import { WORDS } from '../data/words'
import { EChart } from '../components/EChart'
import { StageSwitch } from '../components/common'
import { useStage } from '../lib/stageContext'
import type { Stage } from '../lib/types'
import { STAGE_META } from '../lib/types'

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

function bucket(prof: number): '未掌握' | '熟悉' | '掌握' {
  if (prof >= 80) return '掌握'
  if (prof >= 50) return '熟悉'
  return '未掌握'
}

export function Stats() {
  const p = useProgress()
  const { stage, setStage } = useStage()

  const { totalLearned, mastered, dist, stageData, checkinSeries } = useMemo(() => {
    const base = stage === 'all' ? WORDS : WORDS.filter((w) => w.stage === stage)
    const profs = base.map((w) => store.proficiencyOf(w.id))
    const learned = profs.filter((v) => v > 0).length
    const masteredCount = profs.filter((v) => v >= 80).length
    const counts: Record<string, number> = { 未掌握: 0, 熟悉: 0, 掌握: 0 }
    profs.forEach((v) => (counts[bucket(v)] += 1))

    const stages: Stage[] = ['primary', 'junior', 'senior', 'college']
    const allStage = stages.map((s) => {
      const ws = WORDS.filter((w) => w.stage === s)
      const m = ws.filter((w) => store.proficiencyOf(w.id) >= 80).length
      return { stage: s, total: ws.length, mastered: m, target: STAGE_META[s].target }
    })
    const shown = stage === 'all' ? allStage : allStage.filter((s) => s.stage === stage)

    const days = lastNDays(14)
    const values = days.map((d) => (p.checkIns.includes(d) ? 1 : 0))

    return {
      totalLearned: learned,
      mastered: masteredCount,
      dist: counts,
      stageData: shown,
      checkinSeries: { days, values },
    }
  }, [p, stage])

  const distOption: any = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '45%'],
        data: [
          { name: '未掌握', value: dist['未掌握'], itemStyle: { color: '#ef4444' } },
          { name: '熟悉', value: dist['熟悉'], itemStyle: { color: '#f59e0b' } },
          { name: '掌握', value: dist['掌握'], itemStyle: { color: '#22c55e' } },
        ],
        label: { formatter: '{b}\n{c}个' },
      },
    ],
  }

  const checkinOption: any = {
    tooltip: { trigger: 'axis' },
    grid: { left: 30, right: 10, top: 20, bottom: 20 },
    xAxis: {
      type: 'category',
      data: checkinSeries.days.map((d) => d.slice(5)),
      axisLabel: { fontSize: 10, color: '#94a3b8' },
    },
    yAxis: { type: 'value', min: 0, max: 1, splitNumber: 1, axisLabel: { formatter: (v: number) => (v ? '打卡' : '') } },
    series: [{ type: 'bar', data: checkinSeries.values, itemStyle: { color: '#3366ff', borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }],
  }

  const stageLabel: Record<Stage, string> = { primary: '小学', junior: '中学', senior: '高中', college: '大学' }
  const stageOption: any = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: 30, right: 10, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: stageData.map((s) => stageLabel[s.stage]) },
    yAxis: { type: 'value' },
    series: [
      { name: '已掌握(≥80%)', type: 'bar', data: stageData.map((s) => s.mastered), itemStyle: { color: '#22c55e' } },
      { name: '已收录', type: 'bar', data: stageData.map((s) => s.total), itemStyle: { color: '#3366ff' } },
      { name: '课标目标', type: 'bar', data: stageData.map((s) => s.target), itemStyle: { color: '#cbd5e1' } },
    ],
  }

  const stageName = stage === 'all' ? '全学段' : stageLabel[stage]
  const summary = [
    { label: '学习词数', value: totalLearned, sub: `${stageName}` },
    { label: '掌握词数', value: mastered, sub: '熟练度≥80%' },
    { label: '连续打卡', value: p.streak, sub: '天' },
    { label: '总积分', value: p.points, sub: p.title },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">学习统计</h2>
      </div>
      <StageSwitch value={stage} onChange={setStage} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {summary.map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-2xl font-black text-brand-600">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className="text-[10px] text-slate-400">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="font-bold mb-2">熟练度分布（{stageName}）</div>
        <EChart option={distOption} />
      </div>

      <div className="card p-4">
        <div className="font-bold mb-2">近 14 天打卡</div>
        <EChart option={checkinOption} />
      </div>

      <div className="card p-4">
        <div className="font-bold mb-2">各学段掌握情况</div>
        <EChart option={stageOption} />
      </div>
    </div>
  )
}
