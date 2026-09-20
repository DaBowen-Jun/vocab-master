import { useEffect, useMemo, useRef, useState } from 'react'
import { store } from '../lib/store'
import { WORDS } from '../data/words'
import type { Stage, Word } from '../lib/types'
import { StageTag, StageSwitch } from '../components/common'
import { useStage } from '../lib/stageContext'

type QType = 'mix' | 'en2zh' | 'zh2en'
interface Question {
  word: Word
  prompt: string
  options: string[]
  answer: string
  field: 'term' | 'meaning'
}

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5)
}

function buildQuestions(stage: Stage | 'all', type: QType, n = 8): Question[] {
  const pool = stage === 'all' ? WORDS : WORDS.filter((w) => w.stage === stage)
  const picks = shuffle(pool).slice(0, n)
  return picks.map((word) => {
    const isZh2En = type === 'zh2en' ? true : type === 'en2zh' ? false : Math.random() < 0.5
    const field: 'term' | 'meaning' = isZh2En ? 'term' : 'meaning'
    const answer = isZh2En ? word.term : word.meaning
    const prompt = isZh2En ? word.meaning : word.term
    const distractPool = shuffle(pool.filter((w) => w.id !== word.id)).map((w) => (isZh2En ? w.term : w.meaning))
    const options = shuffle([answer, ...distractPool.slice(0, 3)])
    return { word, prompt, options, answer, field }
  })
}

export function Exam() {
  const { stage, setStage } = useStage()
  const [phase, setPhase] = useState<'config' | 'playing' | 'result'>('config')
  const [type, setType] = useState<QType>('mix')
  const [qs, setQs] = useState<Question[]>([])
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [results, setResults] = useState<{ word: Word; correct: boolean; time: number }[]>([])
  const startedAt = useRef(Date.now())

  useEffect(() => {
    startedAt.current = Date.now()
  }, [qi, phase])

  const start = () => {
    setQs(buildQuestions(stage, type))
    setQi(0)
    setResults([])
    setPicked(null)
    setPhase('playing')
  }

  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    const q = qs[qi]
    const correct = opt === q.answer
    const time = Date.now() - startedAt.current
    setTimeout(() => {
      const nextResults = [...results, { word: q.word, correct, time }]
      setResults(nextResults)
      if (qi + 1 < qs.length) {
        setQi(qi + 1)
        setPicked(null)
      } else {
        nextResults.forEach((r) => store.recordResult(r.word.id, r.correct, r.time, 10))
        setPhase('result')
      }
    }, 450)
  }

  const summary = useMemo(() => {
    const correct = results.filter((r) => r.correct).length
    const earned = correct * 10
    return { correct, total: results.length, earned, accuracy: results.length ? Math.round((correct / results.length) * 100) : 0 }
  }, [results])

  if (phase === 'config') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold">中英考试</h2>
        <StageSwitch value={stage} onChange={setStage} />
        <div className="card p-4 space-y-4">
          <div>
            <div className="text-sm font-bold mb-2">题型</div>
            <div className="flex gap-2">
              {([['mix', '混合'], ['zh2en', '中译英'], ['en2zh', '英译中']] as const).map(([k, label]) => (
                <button key={k} className={`btn flex-1 ${type === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setType(k)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={start}>
            开始考试（8 题）
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <div className="space-y-4">
        <div className="card p-5 text-center">
          <div className="text-5xl font-black text-brand-600">{summary.accuracy}%</div>
          <div className="text-sm text-slate-500 mt-1">
            答对 {summary.correct}/{summary.total} · 获得 <b className="text-amber-600">{summary.earned}</b> 积分
          </div>
        </div>
        <div className="card p-4 space-y-2">
          <div className="text-sm font-bold mb-1">逐题回顾</div>
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <StageTag stage={r.word.stage} />
                {r.word.term}
              </span>
              <span className={r.correct ? 'text-green-600' : 'text-red-500'}>{r.correct ? '✓ 正确' : '✗ 错误'}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => setPhase('config')}>
            返回设置
          </button>
          <button className="btn-primary flex-1" onClick={start}>
            再来一次
          </button>
        </div>
      </div>
    )
  }

  const q = qs[qi]
  return (
    <div className="space-y-4">
      <StageSwitch value={stage} onChange={setStage} />
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">第 {qi + 1}/{qs.length} 题</span>
        <span className="font-semibold text-brand-600">{q.field === 'term' ? '中译英' : '英译中'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${(qi / qs.length) * 100}%` }} />
      </div>
      <div className="card p-6 text-center">
        <div className="text-2xl font-extrabold break-words">{q.prompt}</div>
        {q.field === 'meaning' && <div className="text-xs text-slate-400 mt-1">{q.word.phonetic}</div>}
      </div>
      <div className="grid gap-2">
        {q.options.map((opt) => {
          const chosen = picked === opt
          const isAnswer = opt === q.answer
          let cls = 'card p-4 text-left hover:bg-brand-50 transition'
          if (picked && isAnswer) cls += ' !bg-green-50 !border-green-300'
          else if (picked && chosen && !isAnswer) cls += ' !bg-red-50 !border-red-300'
          return (
            <button key={opt} className={cls} onClick={() => choose(opt)} disabled={!!picked}>
              <span className="flex items-center gap-2">
                <StageTag stage={q.word.stage} />
                {opt}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
