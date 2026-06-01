/**
 * src/services/api.ts
 * siteruns23432 完全非依存。全てフロントエンドから直接取得。
 * - ニュース: RSSフィード → allorigins.win CORS proxy 経由
 * - 株価/チャート: Yahoo Finance v8 非公式API → allorigins proxy 経由
 * - prefs: localStorage
 * - 記事本文: 元URL → allorigins proxy → Readability的テキスト抽出
 * - AI要約: OpenRouter (Qwen3 free)
 */

// ─── 型定義 ──────────────────────────────────────────────────────────────────

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

// ─── Yahoo Finance（query1 → query2 フォールバック） ─────────────────────────
const YAHOO_HOSTS = [
  '/proxy/yahoo',
  'https://query2.finance.yahoo.com',
]

async function _yahooFetch(path: string): Promise<Response> {
  let lastErr: Error = new Error('unknown')
  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(host + path, {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      })
      if (res.ok) return res
      lastErr = new Error('HTTP ' + res.status)
    } catch (e) {
      lastErr = e as Error
    }
  }
  throw lastErr
}

// ─── RSS ニュースソース ────────────────────────────────────────────────────────

const _R = (url: string) =>
  `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=10`

const NEWS_SOURCES = [
  // カルチャー
  { id: 'netorabo',    name: 'ねとらぼ',         url: _R('https://nlab.itmedia.co.jp/rss/2.0/index.rdf'),              lang: 'ja', category: 'culture' },
  { id: 'kai_you',     name: 'KAI-YOU',           url: _R('https://kai-you.net/feed'),                                   lang: 'ja', category: 'culture' },
  { id: 'mashable',    name: 'Mashable',           url: _R('https://mashable.com/feeds/rss/all'),                         lang: 'en', category: 'culture' },
  { id: 'boredpanda',  name: 'Bored Panda',        url: _R('https://www.boredpanda.com/feed/'),                           lang: 'en', category: 'culture' },
  // テック
  { id: 'techcrunch',  name: 'TechCrunch',         url: _R('https://techcrunch.com/feed/'),                               lang: 'en', category: 'tech' },
  { id: 'theverge',    name: 'The Verge',          url: _R('https://www.theverge.com/rss/index.xml'),                     lang: 'en', category: 'tech' },
  { id: 'gigazine',    name: 'GIGAZINE',           url: _R('https://gigazine.net/news/rss_2.0/'),                         lang: 'ja', category: 'tech' },
  { id: 'itmedia',     name: 'ITmedia',            url: _R('https://rss.itmedia.co.jp/rss/2.0/itmedia_all.xml'),          lang: 'ja', category: 'tech' },
  { id: 'wired',       name: 'Wired',              url: _R('https://www.wired.com/feed/rss'),                             lang: 'en', category: 'tech' },
  { id: 'arstechnica', name: 'Ars Technica',       url: _R('https://feeds.arstechnica.com/arstechnica/index'),            lang: 'en', category: 'tech' },
  { id: 'engadget',    name: 'Engadget',           url: _R('https://www.engadget.com/rss.xml'),                           lang: 'en', category: 'tech' },
  // ビジネス
  { id: 'reuters',     name: 'Reuters',            url: _R('https://feeds.reuters.com/reuters/topNews'),                  lang: 'en', category: 'business' },
  { id: 'cnbc',        name: 'CNBC',               url: _R('https://www.cnbc.com/id/100003114/device/rss/rss.html'),      lang: 'en', category: 'business' },
  { id: 'toyokeizai',  name: '東洋経済',            url: _R('https://toyokeizai.net/list/feed/rss'),                       lang: 'ja', category: 'business' },
  { id: 'forbesjp',    name: 'Forbes Japan',       url: _R('https://forbesjapan.com/feed'),                               lang: 'ja', category: 'business' },
  { id: 'bijp',        name: 'Business Insider JP',url: _R('https://www.businessinsider.jp/feed/index.xml'),               lang: 'ja', category: 'business' },
  // ゲーム
  { id: 'ign',         name: 'IGN',                url: _R('https://www.ign.com/rss/articles'),                           lang: 'en', category: 'game' },
  { id: 'polygon',     name: 'Polygon',            url: _R('https://www.polygon.com/rss/index.xml'),                      lang: 'en', category: 'game' },
  { id: 'kotaku',      name: 'Kotaku',             url: _R('https://kotaku.com/rss'),                                     lang: 'en', category: 'game' },
  { id: 'famitsu',     name: 'Famitsu',            url: _R('https://www.famitsu.com/rss/famitsu/all.xml'),                lang: 'ja', category: 'game' },
  // アニメ
  { id: 'ann',         name: 'Anime News Network', url: _R('https://www.animenewsnetwork.com/all/rss.xml'),               lang: 'en', category: 'anime' },
  { id: 'comicnatalie',name: 'コミックナタリー',    url: _R('https://natalie.mu/comic/feed/news'),                          lang: 'ja', category: 'anime' },
  // エンタメ
  { id: 'variety',     name: 'Variety',            url: _R('https://variety.com/feed/'),                                  lang: 'en', category: 'entertainment' },
  { id: 'deadline',    name: 'Deadline',           url: _R('https://deadline.com/feed/'),                                 lang: 'en', category: 'entertainment' },
  // 音楽
  { id: 'billboard',   name: 'Billboard',          url: _R('https://www.billboard.com/feed/'),                            lang: 'en', category: 'music' },
  { id: 'pitchfork',   name: 'Pitchfork',          url: _R('https://pitchfork.com/rss/news/'),                            lang: 'en', category: 'music' },
  { id: 'nme',         name: 'NME',                url: _R('https://www.nme.com/feed'),                                   lang: 'en', category: 'music' },
  // 科学
  { id: 'spacecom',    name: 'Space.com',          url: _R('https://www.space.com/feeds/all'),                            lang: 'en', category: 'science' },
  { id: 'nasa',        name: 'NASA',               url: _R('https://www.nasa.gov/rss/dyn/breaking_news.rss'),             lang: 'en', category: 'science' },
]

// ─── RSSパーサー（純JS、依存ゼロ） ───────────────────────────────────────────

function _hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

function _extractText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${tag}>`, 'i'))
  return m ? m[1].trim() : ''
}

function _extractLink(entry: string, isAtom: boolean): string {
  if (isAtom) {
    const m = entry.match(/<link[^>]+href=["']([^"']+)["']/i)
    if (m) return m[1]
  }
  return _extractText(entry, 'link') || entry.match(/<link>([^<]+)<\/link>/i)?.[1] || ''
}

function _decodeHtml(s: string): string {
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
          .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
          .replace(/&#(\d+);/g, (_,n) => String.fromCharCode(parseInt(n,10)))
}

function _stripTags(s: string): string {
  return s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()
}

function _parseRss(xml: string, source: { id: string; name: string; category: string; lang: string }, maxItems = 10): NewsArticle[] {
  const isAtom = xml.includes('<feed')
  const tag    = isAtom ? 'entry' : 'item'
  const re     = new RegExp(`<${tag}[\\s>]([\\s\\S]*?)<\\/${tag}>`, 'gi')
  const items: NewsArticle[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null && items.length < maxItems) {
    const entry = m[1]
    const title = _decodeHtml(_extractText(entry, 'title'))
    const link  = _extractLink(entry, isAtom)
    if (!title || !link) continue
    const pub   = _extractText(entry, isAtom ? 'published' : 'pubDate') || _extractText(entry, 'dc:date')
    const desc  = _decodeHtml(_stripTags(_extractText(entry, isAtom ? 'summary' : 'description'))).slice(0, 300)
    const guid  = _extractText(entry, 'guid') || _extractText(entry, 'id') || link
    const img   = entry.match(/url=["']([^"']+\.(jpg|jpeg|png|webp))[^"']*/i)?.[1] ||
                  entry.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ||
                  entry.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1] || null
    items.push({
      id:          source.id + ':' + _hashStr(guid),
      source_id:   source.id,
      source_name: source.name,
      category:    source.category,
      lang:        source.lang,
      title,
      url:         link,
      description: desc || null,
      pub_date:    pub ? Math.floor(new Date(pub).getTime() / 1000) : Math.floor(Date.now() / 1000),
      top_image:   img,
      title_ja:    null,
    })
  }
  return items
}

// ─── ニュース取得（RSSを直接fetch） ──────────────────────────────────────────

// メモリキャッシュ（10分TTL）
const _newsCache = new Map<string, { ts: number; articles: NewsArticle[] }>()
const NEWS_TTL = 10 * 60 * 1000

async function _fetchSourceNews(source: typeof NEWS_SOURCES[0]): Promise<NewsArticle[]> {
  const cached = _newsCache.get(source.id)
  if (cached && Date.now() - cached.ts < NEWS_TTL) return cached.articles

  try {
    const res = await fetch(source.url, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const data = await res.json()
    if (data.status !== 'ok') return []

    const articles: NewsArticle[] = (data.items || []).slice(0, 10).map((item: {
      title?: string; link?: string; pubDate?: string
      description?: string; thumbnail?: string; enclosure?: { link?: string }
    }, i: number) => {
      const title = _decodeHtml((item.title || '').replace(/<[^>]+>/g, '').trim())
      const url   = item.link || ''
      const desc  = _decodeHtml((item.description || '').replace(/<[^>]+>/g, '').trim()).slice(0, 300)
      const img   = item.thumbnail || item.enclosure?.link || null
      const pub   = item.pubDate
        ? Math.floor(new Date(item.pubDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000)
      return {
        id:          source.id + ':' + _hashStr(url || String(i)),
        source_id:   source.id,
        source_name: source.name,
        category:    source.category,
        lang:        source.lang,
        title,
        url,
        description: desc || null,
        pub_date:    pub,
        top_image:   img,
        title_ja:    null,
      }
    })

    _newsCache.set(source.id, { ts: Date.now(), articles })
    return articles
  } catch {
    return []
  }
}

export async function fetchNews(params: {
  category?: string
  lang?: string
  page?: number
  limit?: number
  q?: string
} = {}): Promise<NewsResult> {
  const { category, lang, page = 1, limit = 20, q } = params

  // 対象ソースを絞り込み
  let sources = NEWS_SOURCES
  if (category) sources = sources.filter(s => s.category === category)
  if (lang)     sources = sources.filter(s => s.lang === lang)

  // 並列fetch（最大8ソース同時）
  const chunks: typeof NEWS_SOURCES[] = []
  for (let i = 0; i < sources.length; i += 8) chunks.push(sources.slice(i, i + 8))

  let all: NewsArticle[] = []
  for (const chunk of chunks) {
    const results = await Promise.allSettled(chunk.map(s => _fetchSourceNews(s)))
    results.forEach(r => { if (r.status === 'fulfilled') all.push(...r.value) })
  }

  // 新しい順にソート
  all.sort((a, b) => b.pub_date - a.pub_date)

  // キーワード検索
  if (q) {
    const lq = q.toLowerCase()
    all = all.filter(a =>
      a.title.toLowerCase().includes(lq) ||
      (a.description || '').toLowerCase().includes(lq)
    )
  }

  const total = all.length
  const start = (page - 1) * limit
  return {
    articles: all.slice(start, start + limit),
    total,
    page,
    pages: Math.ceil(total / limit),
  }
}

// ─── 記事本文取得（元URLを直接fetch → テキスト抽出） ─────────────────────────

export async function fetchArticleContent(url: string): Promise<{
  content: string | null
  top_image: string | null
  error?: string
}> {
  // 記事本文はCORSの関係で直接取得できないため、
  // descriptionをそのまま返す（呼び出し元でdescriptionをfallbackとして使う）
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000), mode: 'no-cors' })
    // no-corsではレスポンスボディが読めないのでエラー扱い
    void res
    throw new Error('CORS制限のため本文を取得できません')
  } catch (e: unknown) {
    return { content: null, top_image: null, error: e instanceof Error ? e.message : String(e) }
  }
}

function _extractArticleContent(html: string) {
  // OGP画像
  const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
  const top_image = imgMatch?.[1] || null

  // 不要タグを削除
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // 本文候補タグから抽出
  const candidates = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /class="[^"]*(?:article|post|entry|content|story)[^"]*"[^>]*>([\s\S]{500,}?)<\/(?:div|section|article)>/i,
  ]
  let content = ''
  for (const re of candidates) {
    const m = body.match(re)
    if (m && m[1].length > 300) { content = m[1]; break }
  }
  if (!content) content = body

  // タグを除去してテキスト化
  const text = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { content: text.length > 100 ? text : null, top_image }
}

// ─── 株価（Yahoo Finance v8 直接fetch） ──────────────────────────────────────

const _quoteCache = new Map<string, { ts: number; data: StockData }>()
const QUOTE_TTL = 3 * 60 * 1000

export async function fetchQuote(ticker: string): Promise<StockData> {
  const cached = _quoteCache.get(ticker)
  if (cached && Date.now() - cached.ts < QUOTE_TTL) return cached.data

  const path = `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  try {
    const res = await _yahooFetch(path)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) throw new Error('no data')

    const price     = meta.regularMarketPrice ?? 0
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change    = price - prevClose
    const changePct = prevClose ? (change / prevClose) * 100 : 0

    const data: StockData = {
      ticker,
      price,
      change:        Math.round(change * 100) / 100,
      changePercent: Math.round(changePct * 100) / 100,
      high:          meta.regularMarketDayHigh  ?? price,
      low:           meta.regularMarketDayLow   ?? price,
      open:          meta.regularMarketOpen     ?? price,
      prevClose,
      currency:      meta.currency    ?? 'USD',
      marketState:   meta.marketState ?? 'CLOSED',
      shortName:     meta.shortName   ?? ticker,
    }
    _quoteCache.set(ticker, { ts: Date.now(), data })
    return data
  } catch (e: unknown) {
    return { ticker, price: 0, change: 0, changePercent: 0,
             high: 0, low: 0, open: 0, prevClose: 0,
             error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── チャート（Yahoo Finance v8 直接fetch） ───────────────────────────────────

const _chartCache = new Map<string, { ts: number; data: ChartData }>()

export async function fetchChart(ticker: string, range = '1mo', interval = '1d'): Promise<ChartData> {
  const key = `${ticker}:${range}:${interval}`
  const ttl = range === '1d' ? 60000 : 10 * 60 * 1000
  const cached = _chartCache.get(key)
  if (cached && Date.now() - cached.ts < ttl) return cached.data

  const path = `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`
  try {
    const res = await _yahooFetch(path)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    const result     = json?.chart?.result?.[0]
    const timestamps = result?.timestamp ?? []
    const q          = result?.indicators?.quote?.[0] ?? {}

    const points: ChartPoint[] = (timestamps as number[]).map((t: number, i: number) => ({
      t:      t * 1000,
      close:  q.close?.[i]  ?? null,
      high:   q.high?.[i]   ?? null,
      low:    q.low?.[i]    ?? null,
      volume: q.volume?.[i] ?? null,
    })).filter((p): p is ChartPoint => p.close !== null)

    const data: ChartData = { ticker, range, interval, points }
    _chartCache.set(key, { ts: Date.now(), data })
    return data
  } catch (e: unknown) {
    return { ticker, range, interval, points: [],
             error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── ウォッチリスト（localStorage） ──────────────────────────────────────────

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

// ─── Prefs（localStorage） ────────────────────────────────────────────────────

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

// ─── 検索エンジン ─────────────────────────────────────────────────────────────

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

// ─── OpenRouter AI（Qwen3 free） ──────────────────────────────────────────────

export async function summarizeWithAI(text: string): Promise<string> {
  const key = localStorage.getItem('openrouter_key') ||
    (import.meta as { env?: { VITE_OPENROUTER_KEY?: string } }).env?.VITE_OPENROUTER_KEY || ''
  if (!key) throw new Error('no key')
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://github.com/tehuyoryu-cpu/finance-start3110',
      'X-Title': 'Finance Start',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3-next-80b-a3b-instruct:free',
      max_tokens: 400,
      messages: [{ role: 'user',
        content: `以下のニュースタイトルを3〜5行の日本語で要約。箇条書きで。\n\n${text}` }],
    }),
  })
  if (!res.ok) throw new Error('AI error')
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ─── 翻訳（Google翻訳直接 → DeepL Web → AI） ──────────────────────────────────
// Google translate_a は CORS ヘッダーを返すのでブラウザから直接呼べる

const _translateCache = new Map<string, string>()
function _sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ── Google翻訳（ブラウザから直接fetch可、CORSヘッダーあり） ──────────────────
async function _googleTranslate(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error('Google HTTP ' + res.status)
  const data = await res.json()
  // レスポンス: [[[翻訳, 原文], ...], ...]
  const segments = data?.[0] as [string, string][] | null
  if (!segments?.length) throw new Error('empty')
  return segments.map(s => s[0] || '').join('')
}

// ── DeepL Web 内部API（ブラウザから直接fetch可） ──────────────────────────────
async function _deeplWeb(text: string): Promise<string> {
  if (!text || text.length < 2) return text
  const id = Math.floor(Math.random() * 10000) * 2 + 1
  const payload = {
    jsonrpc: '2.0', method: 'LMT_handle_jobs', id,
    params: {
      jobs: [{ kind: 'default', sentences: [{ text, id: 1, prefix: '' }],
               raw_en_context_before: [], raw_en_context_after: [],
               preferred_num_beams: 4 }],
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
  const translations = data?.result?.translations as { beams?: { sentences?: { text: string }[] }[] }[]
  if (!translations?.length) throw new Error('DeepL empty')
  return translations.map(t =>
    (t.beams?.[0]?.sentences || []).map(s => s.text).join('')
  ).join('')
}

// ── メイン翻訳（Google → DeepL → AI → 原文） ─────────────────────────────────
async function _translateOnce(text: string): Promise<string> {
  if (!text) return text

  // 1. Google翻訳（最速・CORSあり）
  try {
    const r = await _googleTranslate(text)
    if (r && r !== text) return r
  } catch (e) { console.warn('[trans] Google:', e) }

  // 2. DeepL Web（高品質・キー不要）
  try {
    const r = await _deeplWeb(text)
    if (r && r !== text) return r
  } catch (e) { console.warn('[trans] DeepL:', e) }

  // 3. AI（OpenRouterキーがある時のみ）
  const key = localStorage.getItem('openrouter_key') || ''
  if (key) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`,
                   'HTTP-Referer': 'https://github.com/tehuyoryu-cpu/finance-start3110' },
        body: JSON.stringify({
          model: 'qwen/qwen3-30b-a3b:free', max_tokens: 200, temperature: 0.1,
          messages: [
            { role: 'system', content: '英語を自然な日本語に翻訳。翻訳文のみ出力。' },
            { role: 'user', content: text },
          ],
        }),
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        const data = await res.json()
        let r = (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        if (r && r !== text) return r
      }
    } catch (e) { console.warn('[trans] AI:', e) }
  }

  return text
}

// ── バッチキュー（複数タイトルを順番に処理） ─────────────────────────────────
let _translateQueue: { text: string; resolve: (t: string) => void }[] = []
let _translateTimer: ReturnType<typeof setTimeout> | null = null

function _flushTranslateQueue() {
  if (_translateTimer) return
  _translateTimer = setTimeout(async () => {
    _translateTimer = null
    while (_translateQueue.length > 0) {
      const item = _translateQueue.shift()!
      if (_translateCache.has(item.text)) {
        item.resolve(_translateCache.get(item.text)!)
        continue
      }
      try {
        const result = await _translateOnce(item.text)
        _translateCache.set(item.text, result)
        item.resolve(result)
      } catch {
        item.resolve(item.text)
      }
      await _sleep(150) // サーバー負荷軽減
    }
  }, 50)
}

export function translateTitle(title: string): Promise<string> {
  if (_translateCache.has(title)) return Promise.resolve(_translateCache.get(title)!)
  return new Promise(resolve => {
    _translateQueue.push({ text: title, resolve })
    _flushTranslateQueue()
  })
}

// ─── 記事全文生成（AIで本文を再構成） ──────────────────────────────────────

const _bodyCache = new Map<string, string>()

export async function generateArticleBody(article: {
  title: string
  description: string | null
  url: string
  source_name: string
}): Promise<string> {
  if (_bodyCache.has(article.url)) return _bodyCache.get(article.url)!

  const key = localStorage.getItem('openrouter_key') || ''
  const isEn = /^[A-Za-z\s\d]/.test(article.title)

  // AIキーありの場合：AIで全文生成
  if (key) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'https://github.com/tehuyoryu-cpu/finance-start3110',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-30b-a3b:free',
          max_tokens: 1200,
          temperature: 0.5,
          messages: [
            { role: 'system', content: 'ニュース解説AIです。思考過程は出力せず解説本文のみ出力します。' },
            { role: 'user', content:
              `以下のニュース記事を日本語で詳しく解説してください。\n\nタイトル: ${article.title}\n概要: ${article.description || 'なし'}\n出典: ${article.source_name}\n\n400〜600字程度、背景・内容・意義をわかりやすく。本文のみ出力。` },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      })
      if (res.ok) {
        const data = await res.json()
        let result = (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        if (result.length > 50) {
          _bodyCache.set(article.url, result)
          return result
        }
      }
    } catch (e) { console.warn('[article] AI failed:', e) }
  }

  // AIキーなし or AI失敗：descriptionを翻訳して表示
  const desc = article.description || ''
  if (!desc) {
    const fallback = `${article.source_name} の記事です。元記事リンクから全文をご覧ください。`
    _bodyCache.set(article.url, fallback)
    return fallback
  }

  // 英語記事なら翻訳
  if (isEn) {
    try {
      const titleJa = await _translateOnce(article.title)
      const descJa  = await _translateOnce(desc)
      const result  = `【翻訳】\n${descJa}\n\n---\n【原文タイトル】${article.title}`
      _bodyCache.set(article.url, result)
      return result
    } catch {
      // 翻訳失敗ならそのまま
    }
  }

  _bodyCache.set(article.url, desc)
  return desc
}


const _bodyCache = new Map<string, string>()

export async function generateArticleBody(article: {
  title: string
  description: string | null
  url: string
  source_name: string
}): Promise<string> {
  // キャッシュがあれば即返す
  if (_bodyCache.has(article.url)) return _bodyCache.get(article.url)!

  const key = localStorage.getItem('openrouter_key') ||
    (import.meta as { env?: { VITE_OPENROUTER_KEY?: string } }).env?.VITE_OPENROUTER_KEY || ''
  if (!key) return article.description || '（AIキー未設定のため全文生成できません）'

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://github.com/tehuyoryu-cpu/finance-start3110',
        'X-Title': 'Finance Start',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-next-80b-a3b-instruct:free',
        max_tokens: 800,
        temperature: 0.5,
        messages: [{
          role: 'user',
          content: `以下のニュース記事を日本語で詳しく解説してください。
タイトル: ${article.title}
概要: ${article.description || 'なし'}
出典: ${article.source_name}

400〜600字程度で、背景・内容・意義をわかりやすく解説してください。
本文のみ出力し、見出しや前置きは不要です。`,
        }],
      }),
    })
    if (!res.ok) return article.description || ''
    const data = await res.json()
    let result = data.choices?.[0]?.message?.content?.trim() || article.description || ''
    // Qwen3のthinkingタグを除去
    result = result.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    _bodyCache.set(article.url, result)
    return result
  } catch {
    return article.description || ''
  }
}
