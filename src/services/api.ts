/**
 * src/services/api.ts
 * siteruns23432 バックエンド（localhost）への接続 + OpenRouter AI
 * バックエンドのポートは vite.config.ts の proxy で /api → localhost:PORT に転送
 */

// ─── バックエンドAPI ──────────────────────────────────────────────────────────

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
  desc_ja: string | null
  pub_date: number
  content: string | null
  content_ja: string | null
  top_image: string | null
}

export interface NewsResult {
  articles: NewsArticle[]
  total: number
  page: number
  pages: number
}

export interface NewsStats {
  byCategory: { category: string; lang: string; n: number; translated: number }[]
  total: number
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
  error?: string
}

export interface Prefs {
  searchEngine: string
  searchEngineNews: string
  readerTheme: string
  readerFontSize: number
}

// ─── News API ─────────────────────────────────────────────────────────────────

export async function fetchNews(params: {
  category?: string
  lang?: string
  page?: number
  limit?: number
  q?: string
  source?: string
} = {}): Promise<NewsResult> {
  const p = new URLSearchParams()
  if (params.category) p.set('category', params.category)
  if (params.lang)     p.set('lang', params.lang)
  if (params.page)     p.set('page', String(params.page))
  if (params.limit)    p.set('limit', String(params.limit))
  if (params.q)        p.set('q', params.q)
  if (params.source)   p.set('source', params.source)
  const res = await fetch('/api/news?' + p)
  if (!res.ok) throw new Error('news API error')
  return res.json()
}

export async function fetchNewsStats(): Promise<NewsStats> {
  const res = await fetch('/api/news/stats')
  if (!res.ok) throw new Error('news stats API error')
  return res.json()
}

export async function fetchArticleContent(id: string): Promise<{
  content: string | null
  content_ja: string | null
  top_image: string | null
  error?: string
}> {
  const res = await fetch(`/api/news/${encodeURIComponent(id)}/content`)
  if (!res.ok) throw new Error('content API error')
  return res.json()
}

// ─── Stocks API ───────────────────────────────────────────────────────────────

export async function fetchStockTickers(): Promise<string[]> {
  const res = await fetch('/api/stocks')
  if (!res.ok) return []
  const data = await res.json()
  return data.tickers || []
}

export async function saveStockTickers(tickers: string[]): Promise<void> {
  await fetch('/api/stocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickers }),
  })
}

// 株価はYahoo Finance非公式エンドポイント経由（バックエンドに/api/quote追加予定）
// フォールバックとしてFinnhubも使用
export async function fetchQuote(ticker: string): Promise<StockData> {
  const res = await fetch(`/api/quote?ticker=${encodeURIComponent(ticker)}`)
  if (!res.ok) throw new Error('quote error')
  return res.json()
}

// ─── Prefs API ────────────────────────────────────────────────────────────────

export async function fetchPrefs(): Promise<Prefs> {
  const res = await fetch('/api/prefs')
  if (!res.ok) return { searchEngine: 'google', searchEngineNews: 'google', readerTheme: 'light', readerFontSize: 15 }
  return res.json()
}

export async function savePrefs(prefs: Partial<Prefs>): Promise<void> {
  await fetch('/api/prefs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  })
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
  const key = localStorage.getItem('openrouter_key') || import.meta.env.VITE_OPENROUTER_KEY || ''
  if (!key) throw new Error('OpenRouter APIキーが未設定です')
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
      messages: [{
        role: 'user',
        content: `以下のニュースタイトルを3〜5行の日本語で要約してください。箇条書きで。\n\n${text}`,
      }],
    }),
  })
  if (!res.ok) throw new Error('AI API error')
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}
