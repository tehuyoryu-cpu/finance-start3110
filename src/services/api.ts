/**
 * src/services/api.ts
 * 完全独立版 - 外部バックエンド不要
 *
 * ニュース   : rss2json.com 経由でRSSをJSON化（CORS対応）
 * 株価/チャート: Yahoo Finance v8（Viteプロキシ /proxy/yahoo 経由）
 * 翻訳       : Google翻訳 → DeepL Web → OpenRouter AI（いずれもキー不要で動作）
 * 記事全文   : AIキーあり→Qwen3解説、なし→description翻訳
 * prefs/watchlist: localStorage
 */

// ═══════════════════════════════════════════════════════
// 型定義
// ═══════════════════════════════════════════════════════

export interface NewsArticle {
  id: string
  source_id: string
  source_name: string
  category: string
  lang: string
  title: string
  title_ja: string | null
  url: string
  description: string | null
  pub_date: number
  top_image: string | null
}

export interface NewsResult {
  articles: NewsArticle[]
  total: number
  page: number
  pages: number
}

export interface StockData {
  ticker: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  prevClose: number
  currency?: string
  marketState?: string
  shortName?: string
  error?: string
}

export interface ChartPoint {
  t: number
  close: number
  high: number | null
  low: number | null
  volume: number | null
}

export interface ChartData {
  ticker: string
  range: string
  interval: string
  points: ChartPoint[]
  error?: string
}

export interface Prefs {
  searchEngine: string
  searchEngineNews: string
  readerTheme: string
  readerFontSize: number
}

// ═══════════════════════════════════════════════════════
// ユーティリティ
// ═══════════════════════════════════════════════════════

function _sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function _hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

function _decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
}

function _isEnglish(text: string): boolean {
  // ASCII文字が70%以上なら英語と判定
  const ascii = (text.match(/[\x20-\x7E]/g) || []).length
  return ascii / text.length > 0.7
}

// ── 複数APIキー管理（ラウンドロビンで負荷分散） ───────────────────────────────
const KEYS_STORAGE = 'openrouter_keys' // JSON配列で保存
let _keyIndex = 0

export function getOpenRouterKeys(): string[] {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE)
    const keys: string[] = raw ? JSON.parse(raw) : []
    // 後方互換: 旧キー（openrouter_key）も含める
    const legacy = localStorage.getItem('openrouter_key') || ''
    if (legacy && !keys.includes(legacy)) keys.unshift(legacy)
    return keys.filter(k => k.trim().length > 0)
  } catch { return [] }
}

export function saveOpenRouterKeys(keys: string[]): void {
  const cleaned = keys.map(k => k.trim()).filter(k => k.length > 0)
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(cleaned))
  // 後方互換: 1つ目を旧フィールドにも保存
  if (cleaned[0]) localStorage.setItem('openrouter_key', cleaned[0])
  else localStorage.removeItem('openrouter_key')
}

/** ラウンドロビンで次のキーを返す */
function _getOpenRouterKey(): string {
  const keys = getOpenRouterKeys()
  if (!keys.length) return ''
  const key = keys[_keyIndex % keys.length]
  _keyIndex = (_keyIndex + 1) % keys.length
  return key
}

/** キーが1つ以上設定されているか */
export function hasAnyKey(): boolean {
  return getOpenRouterKeys().length > 0
}

// ═══════════════════════════════════════════════════════
// ニュース（rss2json.com 経由）
// ═══════════════════════════════════════════════════════

const _R = (url: string) =>
  `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=10`

const NEWS_SOURCES = [
  // カルチャー
  { id: 'netorabo',    name: 'ねとらぼ',          url: _R('https://nlab.itmedia.co.jp/rss/2.0/index.rdf'),      lang: 'ja', category: 'culture' },
  { id: 'kai_you',     name: 'KAI-YOU',            url: _R('https://kai-you.net/feed'),                           lang: 'ja', category: 'culture' },
  { id: 'mashable',    name: 'Mashable',            url: _R('https://mashable.com/feeds/rss/all'),                 lang: 'en', category: 'culture' },
  { id: 'boredpanda',  name: 'Bored Panda',         url: _R('https://www.boredpanda.com/feed/'),                   lang: 'en', category: 'culture' },
  // テック
  { id: 'techcrunch',  name: 'TechCrunch',          url: _R('https://techcrunch.com/feed/'),                       lang: 'en', category: 'tech' },
  { id: 'theverge',    name: 'The Verge',           url: _R('https://www.theverge.com/rss/index.xml'),             lang: 'en', category: 'tech' },
  { id: 'gigazine',    name: 'GIGAZINE',            url: _R('https://gigazine.net/news/rss_2.0/'),                 lang: 'ja', category: 'tech' },
  { id: 'itmedia',     name: 'ITmedia',             url: _R('https://rss.itmedia.co.jp/rss/2.0/itmedia_all.xml'), lang: 'ja', category: 'tech' },
  { id: 'wired',       name: 'Wired',               url: _R('https://www.wired.com/feed/rss'),                     lang: 'en', category: 'tech' },
  { id: 'arstechnica', name: 'Ars Technica',        url: _R('https://feeds.arstechnica.com/arstechnica/index'),    lang: 'en', category: 'tech' },
  { id: 'engadget',    name: 'Engadget',            url: _R('https://www.engadget.com/rss.xml'),                   lang: 'en', category: 'tech' },
  // ビジネス
  { id: 'reuters',     name: 'Reuters',             url: _R('https://feeds.reuters.com/reuters/topNews'),           lang: 'en', category: 'business' },
  { id: 'cnbc',        name: 'CNBC',                url: _R('https://www.cnbc.com/id/100003114/device/rss/rss.html'), lang: 'en', category: 'business' },
  { id: 'toyokeizai',  name: '東洋経済',             url: _R('https://toyokeizai.net/list/feed/rss'),               lang: 'ja', category: 'business' },
  { id: 'forbesjp',    name: 'Forbes Japan',        url: _R('https://forbesjapan.com/feed'),                       lang: 'ja', category: 'business' },
  { id: 'bijp',        name: 'Business Insider JP', url: _R('https://www.businessinsider.jp/feed/index.xml'),      lang: 'ja', category: 'business' },
  // ゲーム
  { id: 'ign',         name: 'IGN',                 url: _R('https://www.ign.com/rss/articles'),                   lang: 'en', category: 'game' },
  { id: 'polygon',     name: 'Polygon',             url: _R('https://www.polygon.com/rss/index.xml'),              lang: 'en', category: 'game' },
  { id: 'kotaku',      name: 'Kotaku',              url: _R('https://kotaku.com/rss'),                             lang: 'en', category: 'game' },
  { id: 'famitsu',     name: 'Famitsu',             url: _R('https://www.famitsu.com/rss/famitsu/all.xml'),        lang: 'ja', category: 'game' },
  // アニメ
  { id: 'ann',         name: 'Anime News Network',  url: _R('https://www.animenewsnetwork.com/all/rss.xml'),       lang: 'en', category: 'anime' },
  { id: 'comicnatalie',name: 'コミックナタリー',     url: _R('https://natalie.mu/comic/feed/news'),                 lang: 'ja', category: 'anime' },
  // エンタメ
  { id: 'variety',     name: 'Variety',             url: _R('https://variety.com/feed/'),                          lang: 'en', category: 'entertainment' },
  { id: 'deadline',    name: 'Deadline',            url: _R('https://deadline.com/feed/'),                         lang: 'en', category: 'entertainment' },
  // 音楽
  { id: 'billboard',   name: 'Billboard',           url: _R('https://www.billboard.com/feed/'),                    lang: 'en', category: 'music' },
  { id: 'pitchfork',   name: 'Pitchfork',           url: _R('https://pitchfork.com/rss/news/'),                   lang: 'en', category: 'music' },
  { id: 'nme',         name: 'NME',                 url: _R('https://www.nme.com/feed'),                           lang: 'en', category: 'music' },
  // 科学
  { id: 'spacecom',    name: 'Space.com',           url: _R('https://www.space.com/feeds/all'),                    lang: 'en', category: 'science' },
  { id: 'nasa',        name: 'NASA',                url: _R('https://www.nasa.gov/rss/dyn/breaking_news.rss'),     lang: 'en', category: 'science' },
]

// 10分キャッシュ
const _newsCache = new Map<string, { ts: number; articles: NewsArticle[] }>()
const NEWS_TTL = 10 * 60 * 1000

async function _fetchSource(source: typeof NEWS_SOURCES[0]): Promise<NewsArticle[]> {
  const cached = _newsCache.get(source.id)
  if (cached && Date.now() - cached.ts < NEWS_TTL) return cached.articles

  try {
    const res = await fetch(source.url, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const data = await res.json()
    if (data.status !== 'ok') return []

    const articles: NewsArticle[] = (data.items || []).slice(0, 10).map((
      item: { title?: string; link?: string; pubDate?: string; description?: string; thumbnail?: string; enclosure?: { link?: string } },
      i: number
    ) => ({
      id:          source.id + ':' + _hashStr(item.link || String(i)),
      source_id:   source.id,
      source_name: source.name,
      category:    source.category,
      lang:        source.lang,
      title:       _decodeHtml((item.title || '').replace(/<[^>]+>/g, '').trim()),
      url:         item.link || '',
      description: _decodeHtml((item.description || '').replace(/<[^>]+>/g, '').trim()).slice(0, 400) || null,
      pub_date:    item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
      top_image:   item.thumbnail || item.enclosure?.link || null,
      title_ja:    null,
    }))

    _newsCache.set(source.id, { ts: Date.now(), articles })
    return articles
  } catch {
    return []
  }
}

export async function fetchNews(params: {
  category?: string; lang?: string; page?: number; limit?: number; q?: string
} = {}): Promise<NewsResult> {
  const { category, lang, page = 1, limit = 20, q } = params

  let sources = NEWS_SOURCES
  if (category) sources = sources.filter(s => s.category === category)
  if (lang)     sources = sources.filter(s => s.lang === lang)

  // 全ソースを並列fetch
  const results = await Promise.allSettled(sources.map(s => _fetchSource(s)))
  let all: NewsArticle[] = []
  results.forEach(r => { if (r.status === 'fulfilled') all.push(...r.value) })

  all.sort((a, b) => b.pub_date - a.pub_date)

  if (q) {
    const lq = q.toLowerCase()
    all = all.filter(a =>
      a.title.toLowerCase().includes(lq) || (a.description || '').toLowerCase().includes(lq)
    )
  }

  const total = all.length
  const start = (page - 1) * limit
  return { articles: all.slice(start, start + limit), total, page, pages: Math.ceil(total / limit) }
}

// ═══════════════════════════════════════════════════════
// 株価・チャート（Yahoo Finance v8 / Viteプロキシ経由）
// ═══════════════════════════════════════════════════════

// 開発時: /proxy/yahoo → query1.finance.yahoo.com (Viteプロキシ)
// 本番時: query2に直接（CORSが通る場合）
async function _yahooFetch(path: string): Promise<Response> {
  const YAHOO_BASE = 'https://query1.finance.yahoo.com'
  const YAHOO_BASE2 = 'https://query2.finance.yahoo.com'

  // 1. Viteプロキシ経由（開発時）
  try {
    const res = await fetch('/proxy/yahoo' + path, {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' },
    })
    if (res.ok) return res
  } catch { /* fallthrough */ }

  // 2. query1 直接（Chrome拡張 manifest host_permissions が通る場合）
  try {
    const res = await fetch(YAHOO_BASE + path, {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' },
    })
    if (res.ok) return res
  } catch { /* fallthrough */ }

  // 3. query2 直接
  try {
    const res = await fetch(YAHOO_BASE2 + path, {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' },
    })
    if (res.ok) return res
  } catch { /* fallthrough */ }

  // 4. allorigins CORSプロキシ経由（最終手段）
  const encoded = encodeURIComponent(YAHOO_BASE + path)
  const res = await fetch(`https://api.allorigins.win/raw?url=${encoded}`, {
    signal: AbortSignal.timeout(12000),
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error('Yahoo Finance HTTP ' + res.status)
  return res
}

const _quoteCache = new Map<string, { ts: number; data: StockData }>()
const QUOTE_TTL = 3 * 60 * 1000

export async function fetchQuote(ticker: string): Promise<StockData> {
  const cached = _quoteCache.get(ticker)
  if (cached && Date.now() - cached.ts < QUOTE_TTL) return cached.data

  try {
    const res = await _yahooFetch(`/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) throw new Error('no data')

    const price     = meta.regularMarketPrice ?? 0
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change    = price - prevClose
    const changePct = prevClose ? (change / prevClose) * 100 : 0

    const data: StockData = {
      ticker, price,
      change:        Math.round(change * 100) / 100,
      changePercent: Math.round(changePct * 100) / 100,
      high:          meta.regularMarketDayHigh ?? price,
      low:           meta.regularMarketDayLow  ?? price,
      open:          meta.regularMarketOpen    ?? price,
      prevClose,
      currency:    meta.currency    ?? 'USD',
      marketState: meta.marketState ?? 'CLOSED',
      shortName:   meta.shortName   ?? ticker,
    }
    _quoteCache.set(ticker, { ts: Date.now(), data })
    return data
  } catch (e) {
    return { ticker, price: 0, change: 0, changePercent: 0,
             high: 0, low: 0, open: 0, prevClose: 0,
             error: e instanceof Error ? e.message : String(e) }
  }
}

const _chartCache = new Map<string, { ts: number; data: ChartData }>()

export async function fetchChart(ticker: string, range = '1mo', interval = '1d'): Promise<ChartData> {
  const ckey = `${ticker}:${range}:${interval}`
  const ttl  = range === '1d' ? 60_000 : 10 * 60_000
  const cached = _chartCache.get(ckey)
  if (cached && Date.now() - cached.ts < ttl) return cached.data

  try {
    const res = await _yahooFetch(`/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json   = await res.json()
    const result = json?.chart?.result?.[0]
    const ts     = (result?.timestamp ?? []) as number[]
    const q      = result?.indicators?.quote?.[0] ?? {}

    const points: ChartPoint[] = ts.map((t, i) => ({
      t: t * 1000,
      close:  q.close?.[i]  ?? null,
      high:   q.high?.[i]   ?? null,
      low:    q.low?.[i]    ?? null,
      volume: q.volume?.[i] ?? null,
    })).filter((p): p is ChartPoint => p.close !== null)

    const data: ChartData = { ticker, range, interval, points }
    _chartCache.set(ckey, { ts: Date.now(), data })
    return data
  } catch (e) {
    return { ticker, range, interval, points: [],
             error: e instanceof Error ? e.message : String(e) }
  }
}

// ═══════════════════════════════════════════════════════
// ウォッチリスト・Prefs（localStorage）
// ═══════════════════════════════════════════════════════

const TICKERS_KEY = 'watchlist_tickers'

export function fetchStockTickers(): Promise<string[]> {
  try {
    const raw = localStorage.getItem(TICKERS_KEY)
    return Promise.resolve(raw ? JSON.parse(raw) : [])
  } catch { return Promise.resolve([]) }
}

export function saveStockTickers(tickers: string[]): Promise<void> {
  localStorage.setItem(TICKERS_KEY, JSON.stringify(tickers))
  return Promise.resolve()
}

const PREFS_KEY = 'app_prefs'
const DEFAULT_PREFS: Prefs = {
  searchEngine: 'google', searchEngineNews: 'google',
  readerTheme: 'dark', readerFontSize: 15,
}

export function fetchPrefs(): Promise<Prefs> {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return Promise.resolve(raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS })
  } catch { return Promise.resolve({ ...DEFAULT_PREFS }) }
}

export function savePrefs(prefs: Partial<Prefs>): Promise<void> {
  const current = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...DEFAULT_PREFS, ...current, ...prefs }))
  return Promise.resolve()
}

// ═══════════════════════════════════════════════════════
// 翻訳（Google翻訳 → DeepL Web → OpenRouter AI）
// キー不要で Google/DeepL が動作。AIはキーある場合のみ。
// ═══════════════════════════════════════════════════════

const _translateCache = new Map<string, string>()

async function _googleTranslate(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error('Google HTTP ' + res.status)
  const data = await res.json()
  const segs = data?.[0] as [string, string][] | null
  if (!segs?.length) throw new Error('empty')
  return segs.map(s => s[0] || '').join('')
}

async function _deeplWeb(text: string): Promise<string> {
  const id = Math.floor(Math.random() * 10000) * 2 + 1
  const payload = {
    jsonrpc: '2.0', method: 'LMT_handle_jobs', id,
    params: {
      jobs: [{ kind: 'default', sentences: [{ text, id: 1, prefix: '' }],
               raw_en_context_before: [], raw_en_context_after: [], preferred_num_beams: 4 }],
      lang: { source_lang_computed: 'EN', target_lang: 'JA' },
      priority: 1,
      commonJobParams: { wasSpoken: false, transcribe_as: '' },
      timestamp: Date.now(),
    },
  }
  let bodyStr = JSON.stringify(payload)
  const iCount = (bodyStr.match(/"i"/g) || []).length
  if ((iCount + 3) % 2 !== 0) bodyStr = bodyStr.replace('"method":"', '"method" : "')

  const res = await fetch('https://www2.deepl.com/jsonrpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://www.deepl.com',
      'Referer': 'https://www.deepl.com/translator',
    },
    body: bodyStr,
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error('DeepL HTTP ' + res.status)
  const data = await res.json()
  if (data.error) throw new Error('DeepL: ' + data.error.message)
  const translations = data?.result?.translations as
    { beams?: { sentences?: { text: string }[] }[] }[] | undefined
  if (!translations?.length) throw new Error('DeepL empty')
  return translations.map(t =>
    (t.beams?.[0]?.sentences || []).map(s => s.text).join('')
  ).join('')
}

async function _translateOnce(text: string): Promise<string> {
  if (!text) return text
  if (_translateCache.has(text)) return _translateCache.get(text)!

  // 1. Google翻訳（CORSヘッダーあり、直接fetchで動作）
  try {
    const r = await _googleTranslate(text)
    if (r && r !== text) { _translateCache.set(text, r); return r }
  } catch (e) { console.warn('[trans] Google:', e) }

  // 2. DeepL Web（ブラウザからは動作するがchrome拡張からはCORSブロックの場合あり）
  try {
    const r = await _deeplWeb(text)
    if (r && r !== text) { _translateCache.set(text, r); return r }
  } catch (e) { console.warn('[trans] DeepL:', e) }

  // 3. OpenRouter AI（キーある時のみ）
  const key = _getOpenRouterKey()
  if (key) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`,
                   'HTTP-Referer': 'https://github.com/tehuyoryu-cpu/finance-start3110' },
        body: JSON.stringify({
          model: 'qwen/qwen3-next-80b-a3b-instruct:free',
          max_tokens: 200, temperature: 0.1,
          messages: [
            { role: 'system', content: '英語を自然な日本語に翻訳。翻訳文のみ出力。' },
            { role: 'user', content: text },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        const data = await res.json()
        const r = (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        if (r && r !== text) { _translateCache.set(text, r); return r }
      }
    } catch (e) { console.warn('[trans] AI:', e) }
  }

  _translateCache.set(text, text)
  return text
}

// バッチキュー（カード一覧の翻訳を順番に処理）
let _transQueue: { text: string; resolve: (t: string) => void }[] = []
let _transTimer: ReturnType<typeof setTimeout> | null = null

function _flushTransQueue() {
  if (_transTimer) return
  _transTimer = setTimeout(async () => {
    _transTimer = null
    // 一度に処理する上限（メモリ保護）
    const MAX_BATCH = 50
    let processed = 0
    while (_transQueue.length > 0 && processed < MAX_BATCH) {
      const item = _transQueue.shift()!
      const result = await _translateOnce(item.text).catch(() => item.text)
      item.resolve(result)
      await _sleep(100)
      processed++
    }
    // まだ残っていれば継続
    if (_transQueue.length > 0) _flushTransQueue()
  }, 100)
}

export function translateTitle(title: string): Promise<string> {
  if (_translateCache.has(title)) return Promise.resolve(_translateCache.get(title)!)
  return new Promise(resolve => {
    _transQueue.push({ text: title, resolve })
    _flushTransQueue()
  })
}

// ═══════════════════════════════════════════════════════
// 記事全文（AIキーあり→Qwen3解説、なし→翻訳+description）
// ═══════════════════════════════════════════════════════

// ── AIリクエストキュー（同時1件に制限してレート制限を回避） ─────────────────
const _aiQueue = (() => {
  let _running = false
  const _queue: Array<() => Promise<void>> = []

  function _next() {
    if (_running || _queue.length === 0) return
    _running = true
    const task = _queue.shift()!
    task().finally(() => {
      _running = false
      _next()
    })
  }

  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        _queue.push(async () => {
          try { resolve(await fn()) } catch (e) { reject(e) }
        })
        _next()
      })
    }
  }
})()

const _bodyCache = new Map<string, string>()

export async function generateArticleBody(article: {
  title: string; description: string | null; url: string; source_name: string
}): Promise<string> {
  const cached = _bodyCache.get(article.url)
  if (cached && cached.length > 20) return cached

  // 利用可能なキーがあるか確認
  const hasKey = _getOpenRouterKey()
  const key = _getOpenRouterKey()

  // ── 記事HTMLをfetchして本文抽出 ───────────────────────────────────────────
  let articleText = article.description || ''
  try {
    const res = await fetch(article.url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
    })
    if (res.ok) {
      const html = await res.text()
      const extracted = _extractTextFromHtml(html)
      if (extracted.length > 200) {
        articleText = extracted
      }
    }
  } catch (e) {
    console.warn('[article] fetch failed, using description:', e)
  }

  // AIキーあり → 抽出本文をAIに渡して解説＋批評生成（複数キーをラウンドロビン）
  if (key) {
    const MODELS = [
      'qwen/qwen3-next-80b-a3b-instruct:free',
      'openai/gpt-oss-120b:free',
      'google/gemma-4-31b-it:free',
      'z-ai/glm-4.5-air:free',
      'meta-llama/llama-3.3-70b-instruct:free',
    ]
    const PROMPT = `あなたは優秀なジャーナリストです。以下のニュース記事を読み、詳しく日本語で解説・批評してください。

【記事情報】
タイトル: ${article.title}
出典: ${article.source_name}
本文:
${articleText.slice(0, 3000)}

【重要な指示】
- 記事に登場する固有名詞・数字・人物・組織を必ず活用すること
- 推測や一般論で埋めず、記事の内容に忠実に書くこと
- 各セクション300字以上書くこと
- 思考過程・前置きは不要

必ず以下の形式で出力：

【解説】
記事で報じられている内容（誰が・何を・いつ・どこで・なぜ）を詳しく説明。背景となる業界動向や社会的文脈も加える。300字以上。

【批評・反論】
この記事への批判的視点を300字以上で述べる。出典の信頼性・一次情報の有無・数字の根拠・取材対象の偏り・記事が触れていない重要な文脈・誇張表現の可能性・利害関係者の視点の欠如などを鋭く指摘。「〜という見方もある」「〜が懸念される」など批評的スタンスで。`

    // グローバルキューで同時リクエスト数を1に制限
    const result = await _aiQueue.run(async () => {
      for (const model of MODELS) {
        // 429リトライ（指数バックオフ）
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${_getOpenRouterKey()}`,
                'HTTP-Referer': 'https://github.com/tehuyoryu-cpu/finance-start3110',
                'X-Title': 'Finance Start',
              },
              body: JSON.stringify({
                model,
                max_tokens: 2000,
                temperature: 0.5,
                messages: [
                  { role: 'system', content: 'あなたはニュース解説・批評AIです。思考過程は出力せず、指示された形式のみ出力します。' },
                  { role: 'user', content: PROMPT },
                ],
              }),
              signal: AbortSignal.timeout(30000),
            })

            if (res.status === 429) {
              // 次のキーで即リトライ（キーが1つしかなければ待機）
              const keys = getOpenRouterKeys()
              if (keys.length > 1) {
                console.warn(`[article] ${model} 429, switching key`)
                // _keyIndex を進めて次のキーへ（次ループで反映）
              } else {
                const wait = 3000 * Math.pow(2, attempt)
                console.warn(`[article] ${model} 429, wait ${wait}ms`)
                await _sleep(wait)
              }
              continue
            }

            if (!res.ok) {
              console.warn(`[article] ${model} HTTP ${res.status}`)
              break // 次のモデルへ
            }

            const data = await res.json()
            const text = (data.choices?.[0]?.message?.content || '')
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .trim()
            if (text.length > 50) return text
            break // 内容が空なら次のモデルへ

          } catch (e) {
            console.warn(`[article] ${model} attempt ${attempt + 1} error:`, e)
            if (attempt < 2) await _sleep(2000)
          }
        }
      }
      return null
    })

    if (result) {
      _bodyCache.set(article.url, result)
      return result
    }
  }

  // AIキーなし or 失敗 → 本文を翻訳して表示
  const desc = articleText || article.description || ''
  if (!desc) {
    const msg = `${article.source_name} の記事です。元記事から全文をご覧ください。`
    _bodyCache.set(article.url, msg)
    return msg
  }

  if (_isEnglish(article.title)) {
    try {
      const descJa = await _translateOnce(desc.slice(0, 1000))
      const result = `【概要（翻訳）】\n${descJa || desc}\n\n【批評・反論】\nAIキー未設定のため自動批評は利用できません。OpenRouterのAPIキーを設定すると、AI による解説・批評が表示されます。`
      _bodyCache.set(article.url, result)
      return result
    } catch { /* fall through */ }
  }

  const result = `【概要】\n${desc}\n\n【批評・反論】\nAIキー未設定のため自動批評は利用できません。`
  _bodyCache.set(article.url, result)
  return result
}

// ── HTML から本文テキストを抽出 ──────────────────────────────────────────────
function _extractTextFromHtml(html: string): string {
  // 不要タグを除去
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // 本文候補セレクター（優先順）
  const candidates = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /class="[^"]*(?:article|post|entry|content|story)[^"]*"[^>]*>([\s\S]{300,}?)<\/(?:div|section|article)>/i,
  ]
  for (const re of candidates) {
    const m = body.match(re)
    if (m && m[1]?.length > 200) { body = m[1]; break }
  }

  return body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 4000)
}


// ═══════════════════════════════════════════════════════
// 検索エンジン
// ═══════════════════════════════════════════════════════

export const SEARCH_ENGINES: Record<string, (q: string) => string> = {
  google:     q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing:       q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  brave:      q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
  yahoo_jp:   q => `https://search.yahoo.co.jp/search?p=${encodeURIComponent(q)}`,
  startpage:  q => `https://www.startpage.com/search?q=${encodeURIComponent(q)}`,
  ecosia:     q => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}`,
}

export function buildSearchUrl(query: string, engine = 'google'): string {
  return (SEARCH_ENGINES[engine] || SEARCH_ENGINES.google)(query)
}

// ═══════════════════════════════════════════════════════
// AI要約（KnowToday用）
// ═══════════════════════════════════════════════════════

export async function summarizeWithAI(text: string): Promise<string> {
  const key = _getOpenRouterKey()
  if (!key) throw new Error('no key') // 全キー試行済み
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`,
               'HTTP-Referer': 'https://github.com/tehuyoryu-cpu/finance-start3110' },
    body: JSON.stringify({
      model: 'qwen/qwen3-next-80b-a3b-instruct:free', max_tokens: 400,
      messages: [
        { role: 'system', content: 'ニュース要約AIです。思考過程は出力しません。' },
        { role: 'user', content: `以下のニュースタイトルを3〜5行の日本語で要約。箇条書きで。\n\n${text}` },
      ],
    }),
  })
  if (!res.ok) throw new Error('AI error')
  const data = await res.json()
  return (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}
