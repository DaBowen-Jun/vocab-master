import { useEffect, useMemo, useRef, useState } from 'react'
import { store } from '../lib/store'
import { useProgress } from '../lib/useProgress'
import { recognitionSupported, recognize, speak, ttsSupported, micPermission } from '../lib/speech'
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
  const [stopRec, setStopRec] = useState<(() => void) | null>(null)
  const [heard, setHeard] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const stopRecRef = useRef<(() => void) | null>(null) // 当前识别会话的停止句柄
  const curWordId = useRef<string>('') // 当前展示单词 id，用于丢弃「已切词」的旧评分
  const [envNote, setEnvNote] = useState<string | null>(null) // 跟读环境提示（不支持/权限被拒）

  // 拼写
  const [input, setInput] = useState('')

  // 切换到下一个单词时是否自动朗读
  const [autoSpeak, setAutoSpeak] = useState(true)

  const word = list[idx]
  curWordId.current = word?.id ?? ''
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
    // 切换单词时若仍在聆听，先停掉旧识别，避免结果记到旧词上
    stopRecRef.current?.()
    stopRecRef.current = null
    setStopRec(null)
    setRecording(false)
  }, [idx, stage])

  // 进入跟读模式时预检环境，提前提示「不支持 / 麦克风被拒」，避免用户点了才发现用不了
  useEffect(() => {
    let cancelled = false
    if (mode !== 'follow') {
      setEnvNote(null)
      return
    }
    if (!recognitionSupported()) {
      setEnvNote('当前浏览器不支持语音识别，请在电脑版 Chrome / Edge 中打开本页；或改用「拼写」模式练习。')
      return
    }
    micPermission().then((st) => {
      if (cancelled) return
      if (st === 'denied') {
        setEnvNote('麦克风权限被拒绝。点地址栏左侧的锁 / 调音台图标，把「麦克风」设为「允许」，刷新页面再试。')
      } else {
        setEnvNote(null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [mode, stage])

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

  const prev = () => {
    const prevIdx = (idx - 1 + list.length) % list.length
    if (autoSpeak && (mode === 'follow' || spellBySound) && ttsSupported()) {
      speak(list[prevIdx].term)
    }
    setIdx(prevIdx)
  }

  const startFollow = async () => {
    if (!recognitionSupported()) {
      setFeedback({
        ok: false,
        text: '当前浏览器不支持语音识别。请用电脑版 Chrome / Edge 体验跟读；手机/微信内置浏览器暂不支持，可改用「拼写」模式练习。',
      })
      return
    }
    const myId = word.id
    setRecording(true)
    setHeard('')
    setScore(null)
    setStopRec(null)
    try {
      const r = await recognize(word.term, setHeard, (stop) => {
        stopRecRef.current = stop
        setStopRec(() => stop)
      })
      // 期间若已切换到别的单词，丢弃这次评分，避免记到旧词上
      if (myId !== curWordId.current) {
        setRecording(false)
        setStopRec(null)
        return
      }
      if (r.noSpeech) {
        setFeedback({ ok: false, text: '没听清，靠近麦克风、音量调大再试一次～' })
      } else {
        setScore(r.score)
        const ok = r.score >= 70
        store.recordResult(word.id, ok, elapsed(), 5)
        setFeedback({
          ok,
          text: ok ? `太棒了！相似度 ${r.score}%` : `再练练～相似度 ${r.score}%，你说的是「${r.transcript}」`,
        })
      }
    } catch (e: any) {
      const msg = (e?.message || '') as string
      if (msg.includes('not-allowed')) {
        setFeedback({
          ok: false,
          text: '麦克风权限被拒绝。点地址栏左侧的锁 / 调音台图标，把「麦克风」设为「允许」，刷新页面再试。',
        })
      } else if (msg.includes('service-not-allowed')) {
        setFeedback({
          ok: false,
          text: '当前浏览器 / 环境不允许语音识别（常见于手机微信等内置浏览器）。请用电脑版 Chrome / Edge，或改用「拼写」模式。',
        })
      } else {
        setFeedback({ ok: false, text: e.message || '识别失败' })
      }
    } finally {
      setRecording(false)
      setStopRec(null)
      stopRecRef.current = null
    }
  }

  // 无麦克风 / 不支持识别时的兜底：自评「已读对」，记录练习进度但不计分
  const markSelf = () => {
    store.recordResult(word.id, true, elapsed(), 0)
    setScore(100)
    setFeedback({ ok: true, text: '已标记为「我已读对」（自评，不计分）。需要真人纠音请用电脑版 Chrome / Edge 的「开始跟读」。' })
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
            {envNote && (
              <div className="text-left text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed mb-3">
                {envNote}
              </div>
            )}
            <div className="flex justify-center gap-3">
              <button className="btn-ghost" onClick={() => speak(word.term)} disabled={!ttsSupported() || recording}>
                {soundOutlined()} 播放发音
              </button>
              {recording ? (
                <button className="btn-primary" onClick={() => stopRec?.()}>
                  {micOutlined()} 停止聆听
                </button>
              ) : (
                <button className="btn-primary" onClick={startFollow}>
                  {micOutlined()} 开始跟读
                </button>
              )}
            </div>
            <button
              className="btn-ghost w-full mt-2 !text-xs !py-2"
              onClick={markSelf}
              disabled={recording}
            >
              麦克风用不了？点此「我已读对」继续（自评，不计分）
            </button>
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
        <button className="btn-ghost flex-1" onClick={prev} disabled={list.length <= 1}>
          ← 上一个
        </button>
        <button className="btn-ghost flex-1" onClick={next}>
          下一个 →
        </button>
      </div>
    </div>
  )
}
