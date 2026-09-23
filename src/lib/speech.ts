// Web Speech API 封装：发音（TTS）+ 语音识别（跟读评分）

// 移动端（iOS/Android/微信）speechSynthesis 经常无声，统一走有道词典 TTS 音频更可靠
function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)
}

// 有道词典在线发音（返回 mp3，移动端浏览器可直接播放，规避 speechSynthesis 手机端无声问题）
function youdaoUrl(text: string, lang: string): string {
  const type = lang === 'en-GB' ? 2 : 1 // 1 美式 / 2 英式
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`
}

let audioEl: HTMLAudioElement | null = null
function playYoudao(text: string, lang: string) {
  if (typeof window === 'undefined') return
  try {
    if (!audioEl) {
      audioEl = new Audio()
      audioEl.preload = 'auto'
    }
    audioEl.src = youdaoUrl(text, lang)
    // iOS 需先 load 再 play，否则可能无声
    audioEl.load()
    const p: any = audioEl.play()
    if (p && typeof p.catch === 'function') {
      p.catch(() => webSpeechSpeak(text, lang))
    }
  } catch {
    webSpeechSpeak(text, lang)
  }
}

// 保留引用，避免 iOS 将 utterance 提前回收导致无声
let currentUtterance: SpeechSynthesisUtterance | null = null

function webSpeechSpeak(text: string, lang: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  try {
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 0.9
    u.pitch = 1
    currentUtterance = u
    u.onend = () => {
      currentUtterance = null
    }
    u.onerror = () => {
      currentUtterance = null
    }
    synth.speak(u)
    // iOS Safari 必须先 pause 再 resume 才能出声
    const ua = navigator.userAgent || ''
    if (/Macintosh|iPhone|iPad|iPod/.test(ua)) {
      synth.pause()
      setTimeout(() => synth.resume(), 200)
    }
  } catch {
    /* noop */
  }
}

export function speak(text: string, lang = 'en-US') {
  if (typeof window === 'undefined') return
  if (isMobile()) {
    playYoudao(text, lang)
    return
  }
  if ('speechSynthesis' in window) {
    webSpeechSpeak(text, lang)
  } else {
    playYoudao(text, lang)
  }
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || isMobile())
}

// ---- 语音识别（跟读） ----
type RecogCtor = new () => any
function getRecognition(): RecogCtor | null {
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function recognitionSupported(): boolean {
  return getRecognition() !== null
}

/** 麦克风权限状态预检（用于提前给出可操作的提示）。浏览器不支持时返回 'unsupported'。 */
export async function micPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (typeof navigator === 'undefined' || !(navigator as any).permissions?.query) return 'unsupported'
  try {
    const st = await (navigator as any).permissions.query({ name: 'microphone' as any })
    return (st?.state as 'granted' | 'denied' | 'prompt') || 'prompt'
  } catch {
    return 'unsupported'
  }
}

export interface RecogResult {
  transcript: string
  score: number // 0-100 与目标词的相似度
  noSpeech?: boolean // 没听到声音（静音超时）
}

/**
 * 录音跟读并评分。
 * @param target 目标英文词（用于相似度对比）
 * @param onPartial 实时返回识别文本
 * @param onReady 识别开始后回调，传入 stop() 以便手动停止
 */
export function recognize(
  target: string,
  onPartial?: (text: string) => void,
  onReady?: (stop: () => void) => void,
): Promise<RecogResult> {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognition()
    if (!Ctor) {
      reject(new Error('当前浏览器不支持语音识别（建议用电脑版 Chrome / Edge）'))
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.maxAlternatives = 5 // 多候选里挑最像目标词的，显著缓解评分过严
    let finalText = ''
    let settled = false
    const tgt = target.toLowerCase()

    const finish = (r: RecogResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(r)
    }
    const fail = (err: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(err)
    }

    // 安全网：最长聆听 10s 自动结束，避免一直「聆听中…」
    const timer = setTimeout(() => {
      try {
        rec.stop()
      } catch {
        /* noop */
      }
    }, 10000)

    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) {
          // 在所有候选里挑与目标词最相似的，作为本段最终结果
          let best = res[0].transcript
          let bestSim = similarity(tgt, res[0].transcript.toLowerCase())
          for (let k = 1; k < res.length; k++) {
            const s = similarity(tgt, res[k].transcript.toLowerCase())
            if (s > bestSim) {
              bestSim = s
              best = res[k].transcript
            }
          }
          finalText = (finalText ? finalText + ' ' : '') + best
        } else {
          interim += res[0].transcript
        }
      }
      onPartial?.(finalText || interim)
    }
    rec.onerror = (e: any) => {
      const name = e?.error || 'error'
      if (name === 'no-speech') {
        finish({ transcript: '', score: 0, noSpeech: true })
      } else if (name === 'aborted') {
        // 手动停止：以已识别内容结算
        finish({ transcript: finalText.trim(), score: similarity(tgt, finalText.trim().toLowerCase()) })
      } else if (name === 'not-allowed' || name === 'service-not-allowed') {
        // 麦克风权限被拒 / 环境不允许：直接抛原始错误名，交由 UI 给出可操作提示
        fail(new Error(name))
      } else {
        fail(new Error(`识别失败：${name}`))
      }
    }
    rec.onend = () => {
      finish({ transcript: finalText.trim(), score: similarity(tgt, finalText.trim().toLowerCase()) })
    }
    // 关键：rec.start() 在麦克风被拒/环境不允许时会「同步抛错」，
    // 必须 try/catch 否则 promise 永远 pending、按钮卡在「聆听中…」
    try {
      rec.start()
    } catch (err: any) {
      const nm = err?.name === 'NotAllowedError' ? 'not-allowed' : err?.error || err?.name || 'start-failed'
      fail(new Error(nm))
      return
    }
    onReady?.(() => {
      try {
        rec.stop()
      } catch {
        /* noop */
      }
    })
  })
}

// 编辑距离 -> 相似度（0-100）
export function similarity(a: string, b: string): number {
  a = a.replace(/[^a-z]/g, '')
  b = b.replace(/[^a-z]/g, '')
  if (!a && !b) return 100
  if (!a || !b) return 0
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
  const dist = dp[m][n]
  return Math.round((1 - dist / Math.max(m, n)) * 100)
}
