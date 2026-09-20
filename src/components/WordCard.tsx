import { useEffect, useState } from 'react'
import { soundOutlined, CheckCircleIcon, SpinnerIcon, BoxIcon, BulbIcon, BookIcon } from './icons'
import { speak } from '../lib/speech'
import { ProficiencyBar, StageTag, StarRating } from './common'
import type { Word } from '../lib/types'
import { store } from '../lib/store'
import { getLiveWord, hasLiveData, type LiveWord } from '../lib/wordSource'

export function WordCard({ word, onClose }: { word: Word; onClose: () => void }) {
  const prof = store.proficiencyOf(word.id)
  const [live, setLive] = useState<LiveWord | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLive(null)
    setLoading(true)
    getLiveWord(word.term)
      .then((r) => {
        if (!cancelled) setLive(r)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [word.term])

  const isLive = hasLiveData(live)
  const phonetic = live?.phonetic || word.phonetic
  const meaning = live?.meaningZh || word.meaning
  const pos = live?.pos || word.pos
  const examples =
    live && live.examples.length > 0
      ? live.examples
      : word.examples.map((e) => ({ en: e.en, zh: e.zh }))

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="card w-full sm:max-w-md rounded-b-none sm:rounded-2xl p-5 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <StageTag stage={word.stage} />
            <div>
              <div className="text-2xl font-extrabold">{word.term}</div>
              <div className="text-xs text-slate-400">{phonetic}</div>
            </div>
          </div>
          <button className="btn-ghost !px-3 !py-2" onClick={() => speak(word.term)} title="播放发音">
            {soundOutlined()} 发音
          </button>
        </div>

        {/* 实时数据源标记 */}
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          {loading ? (
            <span className="text-slate-400 flex items-center gap-1">
              <SpinnerIcon className="w-3.5 h-3.5 animate-spin" /> 正在从真实 API 拉取实时数据…
            </span>
          ) : isLive ? (
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5" /> 实时 API{live?.source === 'cache' ? '（已缓存）' : ''}
            </span>
          ) : (
            <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <BoxIcon className="w-3.5 h-3.5" /> 离线词库（实时获取失败，已回退）
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-semibold text-brand-700">{meaning}</span>
          <span className="text-xs text-slate-400">{pos}</span>
          <StarRating level={word.level} />
        </div>

        {/* 熟练度 */}
        <div className="mt-4">
          <div className="text-xs text-slate-500 mb-1">当前熟练度</div>
          <ProficiencyBar value={prof} />
        </div>

        {/* 用法说明卡片 */}
        <div className="mt-4 card !shadow-none bg-brand-50/60 border-brand-100 p-3">
          <div className="text-xs font-bold text-brand-700 mb-1 flex items-center gap-1">
            <BulbIcon className="w-3.5 h-3.5" /> 用法说明
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{word.usage}</p>
        </div>

        {/* 例句卡片 */}
        <div className="mt-3">
          <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
            <BookIcon className="w-3.5 h-3.5" /> 例句{isLive ? '（实时）' : ''}
          </div>
          <div className="space-y-2">
            {examples.map((ex, i) => (
              <button
                key={i}
                className="w-full text-left card !shadow-none bg-slate-50 hover:bg-slate-100 p-3 transition"
                onClick={() => speak(ex.en)}
              >
                <div className="text-sm font-medium">{ex.en}</div>
                {ex.zh && <div className="text-xs text-slate-500">{ex.zh}</div>}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary w-full mt-5" onClick={onClose}>
          知道了
        </button>
      </div>
    </div>
  )
}
