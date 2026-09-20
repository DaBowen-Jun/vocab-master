import { useMemo, useState } from 'react'
import { store } from '../lib/store'
import { WORDS } from '../data/words'
import type { Word } from '../lib/types'
import { ProficiencyBar, StarRating, StageSwitch, WordBrief } from '../components/common'
import { WordCard } from '../components/WordCard'
import { useStage } from '../lib/stageContext'
import { syncWordsFromApi } from '../lib/wordSource'

export function WordBook() {
  const { stage, setStage } = useStage()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Word | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncText, setSyncText] = useState('')

  const list = useMemo(() => {
    const base = stage === 'all' ? WORDS : WORDS.filter((w) => w.stage === stage)
    const kw = q.trim().toLowerCase()
    const matched = kw
      ? base.filter((w) => w.term.toLowerCase().includes(kw) || w.meaning.includes(q.trim()))
      : base
    // 熟练度从低到高排序
    return [...matched].sort((a, b) => store.proficiencyOf(a.id) - store.proficiencyOf(b.id))
  }, [stage, q])

  const runSync = async () => {
    if (syncing) return
    setSyncing(true)
    setSyncText('0 / ' + list.length)
    try {
      const ok = await syncWordsFromApi(
        list.map((w) => w.term),
        (done, total) => setSyncText(`${done} / ${total}`),
      )
      setSyncText(`完成：成功获取 ${ok} / ${list.length} 个词的实时数据`)
    } catch {
      setSyncText('同步出错，请稍后重试')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">词卡本</h2>
        <button
          className="btn-ghost !px-3 !py-1.5 text-xs"
          onClick={runSync}
          disabled={syncing}
          title="从 freeDictionaryAPI + MyMemory 实时拉取音标/释义/例句"
        >
          {syncing ? `同步中 ${syncText}` : '🌐 从真实 API 同步'}
        </button>
      </div>

      {syncText && !syncing && (
        <div className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5">{syncText}</div>
      )}

      <StageSwitch value={stage} onChange={setStage} />

      <input
        className="w-full px-4 py-2.5 rounded-full border border-slate-200 outline-none focus:border-brand-400 text-sm"
        placeholder="搜索单词 / 释义…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <p className="text-xs text-slate-400">按熟练度从低到高排序，优先复习薄弱词汇（点击查看用法与例句）。</p>

      <div className="space-y-2">
        {list.map((w) => (
          <button key={w.id} className="card p-3 w-full text-left hover:bg-brand-50/50 transition" onClick={() => setOpen(w)}>
            <WordBrief word={w} />
            <div className="mt-2">
              <ProficiencyBar value={store.proficiencyOf(w.id)} />
            </div>
          </button>
        ))}
        {list.length === 0 && <div className="text-center text-slate-400 text-sm py-8">没有匹配的单词</div>}
      </div>

      {open && <WordCard word={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
