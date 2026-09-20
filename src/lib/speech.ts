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

export interface RecogResult {
  transcript: string
  score: number // 0-100 与目标词的相似度
}

/**
 * 录音跟读并评分。
 * @param target 目标英文词（用于相似度对比）
 * @param onPartial 实时返回识别文本
 */
export function recognize(
  target: string,
  onPartial?: (text: string) => void,
): Promise<RecogResult> {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognition()
    if (!Ctor) {
      reject(new Error('当前浏览器不支持语音识别（建议用 Chrome / Edge）'))
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.maxAlternatives = 1
    let finalText = ''
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t
        else interim += t
      }
      onPartial?.(finalText || interim)
    }
    rec.onerror = (e: any) => reject(new Error(e.error || '识别失败'))
    rec.onend = () => {
      const transcript = finalText.trim()
      resolve({ transcript, score: similarity(target.toLowerCase(), transcript.toLowerCase()) })
    }
    rec.start()
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
