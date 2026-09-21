import { useEffect, useMemo, useState } from 'react'
import { store } from '../lib/store'
import { useProgress } from '../lib/useProgress'
import { recognitionSupported, recognize, speak, ttsSupported } from '../lib/speech'
import { StageSwitch, StageTag as StageTagInline } from '../components/common'
import { micOutlined, soundOutlined, HeadphonesIcon, PenIcon } from '../components/icons'
import { useStage } from '../lib/stageContext'
import { unitLabelOf } from '../data/unitOrder'
import type { Word } from '../lib/types'

type Mode = 'follow' | 'spell'

export function Learn() {
  const [mode, setMode] = useState<Mode>('follow')
  const [order, setOrder] = useState<'unit' | 'weak'>('unit') // 教材单元顺序 / 薄弱优先
  const [spellBySound, setSpellBySound] = useState(true) // true=听音拼写 false=看义拼写
  const { stage, setStage } = useStage()
  const list = useMemo<Word[]>(
    () => (order === 'unit' ? store.unitOrder(stage) : store.weakFirst(stage)),
    [stage, order],
  )
  const [idx, setIdx] = useState(0)
  const [startedAt, setStartedAt] = useState(Date.now())
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  // 跟读
  const [recording, setRecording] = useState(false)
  const [heard, setHeard] = useState('')
  const [score, setScore] = useState<number | null>(null)

  // 拼写
  const [input, setInput] = useState('')

  // 切换到下一个单词时是否自动朗读
  const [autoSpeak, setAutoSpeak] = useState(true)

  const word = list[idx]
  const p = useProgress()

  useEffect(() => {
    setIdx(0)
  }, [stage, mode, order])

  useEffect(() => {
    setStartedAt(Date.now())
    setFeedback(null)
    setHeard('')
    setScore(null)
    setInput('')
  }, [idx, stage])

  const elapsed = () => Date.now() - startedAt

  // 下一个：开启「自动发音」时先朗读新词再切换。
  // 跟读模式、听音拼写模式才读；「看义拼写」是看中文写英文，不需要读音。
  const next = () => {
    const nextIdx = (idx + 1) % list.length
    if (autoSpeak && (mode === 'follow' || spellBySound) && ttsSupported()) {
      speak(list[nextIdx].term)
    }
    setIdx(nextIdx)
  }

  const startFollow = async () => {
    if (!recognitionSupported()) {
      setFeedback({ ok: false, text: '当前浏览器不支持语音识别，请用 Chrome / Edge 体验跟读评分。' })
      return
    }
    setRecording(true)
    setHeard('')
    setScore(null)
    try {
      const r = await recognize(word.term, setHeard)
      setScore(r.score)
      const ok = r.score >= 70
      store.recordResult(word.id, ok, elapsed(), 5)
      setFeedback({
        ok,
        text: ok ? `太棒了！相似度 ${r.score}%` : `再练练～相似度 ${r.score}%，你说的是「${r.transcript}」`,
      })
    } catch (e: any) {
      setFeedback({ ok: false, text: e.message || '识别失败' })
    } finally {
      setRecording(false)
    }
  }

  const submitSpell = () => {
    const ok = input.trim().toLowerCase() === word.term.toLowerCase()
    store.recordResult(word.id, ok, elapsed(), 5)
    setFeedback({ ok, text: ok ? '拼写正确！+5 积分' : `正确拼写是「${word.term}」` })
    setInput('')
  }

  if (!word) {
    return (
      <div className="space-y-4">
        <StageSwitch value={stage} onChange={setStage} />
        <div className="card p-8 text-center text-slate-400">该学段暂无单词，去「全部」或其他学段试试～</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <StageSwitch value={stage} onChange={setStage} />

      <div className="flex gap-2">
        <button className={`btn flex-1 ${mode === 'follow' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('follow')}>
          <HeadphonesIcon className="w-4 h-4" /> 跟读
        </button>
        <button className={`btn flex-1 ${mode === 'spell' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('spell')}>
          <PenIcon className="w-4 h-4" /> 拼写
        </button>
      </div>

      {/* 背诵顺序：教材单元顺序 / 薄弱优先 */}
      <div className="flex gap-2">
        <button className={`btn flex-1 ${order === 'unit' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOrder('unit')}>
          教材单元顺序
        </button>
        <button className={`btn flex-1 ${order === 'weak' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOrder('weak')}>
          薄弱优先
        </button>
      </div>

      {/* 卡片 */}
      <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StageTagInline stage={word.stage} />
              {order === 'unit' && unitLabelOf(word.stage, word.term) && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
                  {unitLabelOf(word.stage, word.term)}
                </span>
              )}
            </div>
          <span className="text-xs text-slate-400">
            {idx + 1}/{list.length} · 熟练度 {store.proficiencyOf(word.id)}%
          </span>
        </div>

        {mode === 'follow' ? (
          <div className="text-center py-2">
            <div className="text-3xl font-extrabold mb-1">{word.term}</div>
            <div className="text-slate-400 text-sm mb-4">
              {word.phonetic ? `${word.phonetic} · ` : ''}
              {word.meaning}
            </div>
            <div className="flex justify-center gap-3">
              <button className="btn-ghost" onClick={() => speak(word.term)} disabled={!ttsSupported()}>
                {soundOutlined()} 播放发音
              </button>
              <button className="btn-primary" onClick={startFollow} disabled={recording}>
                {micOutlined()} {recording ? '聆听中…' : '开始跟读'}
              </button>
            </div>
            {heard && <div className="mt-4 text-sm text-slate-500">识别到：<b>{heard}</b></div>}
            {score !== null && (
              <div className="mt-2 text-lg font-black" style={{ color: score >= 70 ? '#22c55e' : '#ef4444' }}>
                评分 {score}%
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="flex justify-center gap-2 mb-3">
              <button className={`btn-ghost !px-3 ${spellBySound ? '!bg-brand-100' : ''}`} onClick={() => setSpellBySound(true)}>
                听音拼写
              </button>
              <button className={`btn-ghost !px-3 ${!spellBySound ? '!bg-brand-100' : ''}`} onClick={() => setSpellBySound(false)}>
                看义拼写
              </button>
            </div>
            {spellBySound ? (
              <button className="btn-primary mb-3" onClick={() => speak(word.term)} disabled={!ttsSupported()}>
                {soundOutlined()} 播放单词发音
              </button>
            ) : (
              <div className="text-2xl font-bold mb-3">{word.meaning}</div>
            )}
            <input
              className="w-full text-center text-lg px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400"
              placeholder="输入英文拼写…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSpell()}
              autoFocus
            />
            <button className="btn-primary w-full mt-3" onClick={submitSpell}>
              提交
            </button>
          </div>
        )}

        {feedback && (
          <div
            className={`mt-4 text-center text-sm font-semibold rounded-xl py-2 ${
              feedback.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => setAutoSpeak(e.target.checked)}
            className="w-4 h-4 accent-brand-500 cursor-pointer"
          />
          自动发音
        </label>
        <button className="btn-ghost flex-1" onClick={next}>
          下一个 →
        </button>
      </div>
    </div>
  )
}
