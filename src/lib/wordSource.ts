// 真实 API 数据源（运行时接入）
// ------------------------------------------------------------------
// 使用免费、无需密钥、且支持浏览器跨域（CORS）的公开接口：
//   1) freeDictionaryAPI  —— 权威音标、词性、英文释义与例句
//   2) MyMemory 翻译 API  —— 免费中英翻译，用于获取中文释义
// 任意一步失败都会回退到已打包的词库数据，保证离线可用、应用不崩。
// 结果做「内存 + localStorage」缓存，避免重复请求与触发限流。

export interface LiveWord {
  phonetic?: string
  pos?: string
  meaningZh?: string
  examples: { en: string; zh?: string }[]
  source: 'api' | 'cache' | 'fallback'
}

const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
const TRANS_API = 'https://api.mymemory.translated.net/get'
const CACHE_KEY = 'liveWordsCache'

type Cache = Record<string, LiveWord>

function loadCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Cache
  } catch {
    return {}
  }
}

let cache: Cache = loadCache()

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* 忽略存储异常（如隐私模式） */
  }
}

async function fetchJson(url: string, timeout = 6000): Promise<any | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

interface DictResult {
  phonetic?: string
  pos?: string
  examples: { en: string }[]
}

async function fetchDict(term: string): Promise<DictResult | null> {
  const data = await fetchJson(DICT_API + encodeURIComponent(term))
  if (!Array.isArray(data) || data.length === 0) return null
  const entry = data[0]
  let phonetic = entry.phonetic as string | undefined
  if (!phonetic && Array.isArray(entry.phonetics)) {
    phonetic = entry.phonetics.find((p: any) => p?.text)?.text
  }
  let pos: string | undefined
  const examples: { en: string }[] = []
  for (const m of entry.meanings || []) {
    if (!pos) pos = m.partOfSpeech
    for (const d of m.definitions || []) {
      if (d?.example && examples.length < 3) examples.push({ en: d.example })
    }
  }
  return { phonetic, pos, examples }
}

async function fetchZh(term: string): Promise<string | undefined> {
  const data = await fetchJson(
    `${TRANS_API}?q=${encodeURIComponent(term)}&langpair=en|zh-CN`,
  )
  const txt: string | undefined = data?.responseData?.translatedText
  if (!txt || txt.includes('MYMEMORY WARNING') || txt === term) return undefined
  return txt
}

/** 获取单词的实时数据；命中缓存直接返回，未命中则并行请求两个 API 并缓存。 */
export async function getLiveWord(term: string): Promise<LiveWord> {
  const key = term.toLowerCase()
  if (cache[key]) return { ...cache[key], source: 'cache' }

  const [dict, zh] = await Promise.all([fetchDict(key), fetchZh(key)])
  const examples = (dict?.examples || []).map((e) => ({ en: e.en }))

  const live: LiveWord = {
    phonetic: dict?.phonetic,
    pos: dict?.pos,
    meaningZh: zh,
    examples,
    source: 'api',
  }
  cache[key] = live
  saveCache()
  return live
}

/** 是否拿到了有效的实时数据（用于 UI 展示「实时」标记） */
export function hasLiveData(live: LiveWord | null): boolean {
  return !!live && (!!live.phonetic || !!live.meaningZh || live.examples.length > 0)
}

/**
 * 批量同步词库到本地缓存（受控并发，避免触发限流）。
 * 每完成一个词回调 onProgress(已完成, 总数)，便于 UI 展示进度。
 */
export async function syncWordsFromApi(
  terms: string[],
  onProgress?: (done: number, total: number) => void,
  concurrency = 5,
): Promise<number> {
  const total = terms.length
  let done = 0
  let ok = 0
  const worker = async (t: string) => {
    const r = await getLiveWord(t)
    if (hasLiveData(r)) ok++
    done++
    onProgress?.(done, total)
  }
  const queue = [...terms]
  const runners: Promise<void>[] = []
  for (let i = 0; i < Math.min(concurrency, total); i++) {
    runners.push(
      (async () => {
        while (queue.length) {
          const t = queue.shift()!
          await worker(t)
        }
      })(),
    )
  }
  await Promise.all(runners)
  return ok
}
