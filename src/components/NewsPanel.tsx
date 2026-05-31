import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchNews, buildSearchUrl, fetchArticleContent, type NewsArticle, type Prefs } from '../services/api'

const CATEGORIES = [
  { value: '',              label: '全て' },
  { value: 'culture',      label: '🌐 カルチャー' },
  { value: 'tech',         label: '💻 テック' },
  { value: 'business',     label: '📈 ビジネス' },
  { value: 'game',         label: '🎮 ゲーム' },
  { value: 'anime',        label: '🎌 アニメ' },
  { value: 'entertainment',label: '🎬 エンタメ' },
  { value: 'music',        label: '🎵 音楽' },
  { value: 'science',      label: '🔬 科学' },
]
const BADGE_COLORS: Record<string, string> = {
  culture: 'bg-purple-600', tech: 'bg-green-700', business: 'bg-blue-700',
  game: 'bg-orange-600', anime: 'bg-amber-600', entertainment: 'bg-pink-700',
  music: 'bg-yellow-700', science: 'bg-teal-700',
}

interface Props { prefs: Prefs }

export default function NewsPanel({ prefs }: Props) {
  const [articles, setArticles]   = useState<NewsArticle[]>([])
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState('')
  const [lang, setLang]           = useState('')
  const [q, setQ]                 = useState('')
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const [pages, setPages]         = useState(1)
  const [reader, setReader]       = useState<NewsArticle | null>(null)
  const searchTimer               = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const data = await fetchNews({ category, lang, q, page: p, limit: 20 })
      setArticles(data.articles)
      setTotal(data.total)
      setPages(data.pages)
      setPage(p)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [category, lang, q])

  useEffect(() => { load(1) }, [load])

  const onSearch = (v: string) => {
    setQ(v)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(1), 350)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* フィルター */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={category} onChange={e => { setCategory(e.target.value); load(1) }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:border-blue-500 outline-none transition-colors">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={lang} onChange={e => { setLang(e.target.value); load(1) }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:border-blue-500 outline-none transition-colors">
          <option value="">全言語</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
        <input value={q} onChange={e => onSearch(e.target.value)}
          placeholder="タイトル検索..."
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-xs text-zinc-200 w-44 focus:border-blue-500 outline-none transition-colors" />
        {q && (
          <button onClick={() => window.open(buildSearchUrl(q, prefs.searchEngine), '_blank')}
            className="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded-lg transition-colors">
            🔍 Web検索
          </button>
        )}
      </div>

      {/* 記事一覧 */}
      {loading ? (
        <div className="space-y-3 stagger">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-fade-up rounded-xl p-4 border border-zinc-800">
              <div className="animate-shimmer h-3 w-1/4 rounded mb-2" />
              <div className="animate-shimmer h-4 w-3/4 rounded mb-1" />
              <div className="animate-shimmer h-3 w-full rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {articles.map(a => (
            <article key={a.id}
              onClick={() => setReader(a)}
              className="animate-fade-up bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600
                         rounded-xl p-4 cursor-pointer transition-all duration-200
                         hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${BADGE_COLORS[a.category] || 'bg-zinc-600'}`}>
                  {CATEGORIES.find(c => c.value === a.category)?.label || a.category}
                </span>
                <span className="text-xs text-zinc-500">{a.source_name}</span>
                <span className="text-xs text-zinc-600 ml-auto">
                  {a.pub_date ? new Date(a.pub_date * 1000).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="font-semibold text-sm text-zinc-100 leading-snug">
                {a.title_ja || a.title}
              </p>
              {a.title_ja && a.title !== a.title_ja && (
                <p className="text-xs text-zinc-500 mt-0.5">{a.title}</p>
              )}
              {(a.desc_ja || a.description) && (
                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {a.desc_ja || a.description}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => load(Math.max(1, page - 1))} disabled={page <= 1}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-xs transition-all hover:scale-105 active:scale-95">
            ◀
          </button>
          <span className="text-xs text-zinc-400">{page} / {pages}（{total}件）</span>
          <button onClick={() => load(Math.min(pages, page + 1))} disabled={page >= pages}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-xs transition-all hover:scale-105 active:scale-95">
            ▶
          </button>
        </div>
      )}

      {/* リーダーモーダル */}
      {reader && (
        <ReaderModal article={reader} prefs={prefs} onClose={() => setReader(null)} />
      )}
    </div>
  )
}

// ─── リーダーモーダル ─────────────────────────────────────────────────────────
function ReaderModal({ article, prefs, onClose }: { article: NewsArticle; prefs: Prefs; onClose: () => void }) {
  const [content, setContent]   = useState<{ content_ja: string | null; content: string | null; top_image: string | null; error?: string } | null>(null)
  const [loading, setLoading]   = useState(true)
  const [lang, setLang]         = useState<'ja' | 'orig'>('ja')
  const [theme, setTheme]       = useState(prefs.readerTheme || 'dark')
  const [fontSize, setFontSize] = useState(prefs.readerFontSize || 15)

  useEffect(() => {
    fetchArticleContent(article.id)
      .then(d => { setContent(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [article.id])

  const themeClass = theme === 'light' ? 'bg-white text-zinc-900'
                   : theme === 'sepia' ? 'bg-amber-50 text-amber-900'
                   : 'bg-zinc-900 text-zinc-100'

  const title = lang === 'ja' ? (article.title_ja || article.title) : article.title
  const body  = lang === 'ja' ? (content?.content_ja || content?.content || '') : (content?.content || '')

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-scale"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`animate-pop-in w-full max-w-2xl max-h-[88vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl ${themeClass}`}>
        {/* ヘッダー */}
        <div className="flex items-center gap-2 p-3 bg-zinc-950 text-white flex-shrink-0">
          <span className="flex-1 text-xs font-bold truncate">{title}</span>
          <div className="flex gap-1 flex-shrink-0">
            {/* 言語切替 */}
            {['ja','orig'].map(l => (
              <button key={l} onClick={() => setLang(l as 'ja'|'orig')}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${lang === l ? 'bg-blue-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                {l === 'ja' ? '日本語' : '原文'}
              </button>
            ))}
            {/* テーマ */}
            {(['dark','light','sepia'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${theme === t ? 'bg-blue-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '📜'}
              </button>
            ))}
            <button onClick={() => setFontSize(f => Math.max(12, f - 1))} className="text-xs bg-zinc-700 hover:bg-zinc-600 px-1.5 rounded transition-colors">A-</button>
            <button onClick={() => setFontSize(f => Math.min(24, f + 1))} className="text-xs bg-zinc-700 hover:bg-zinc-600 px-1.5 rounded transition-colors">A+</button>
            <button onClick={onClose} className="text-xs bg-zinc-700 hover:bg-red-600 px-2 rounded transition-colors">✕</button>
          </div>
        </div>
        {/* ソースバー */}
        <div className="flex gap-3 items-center px-4 py-2 bg-zinc-800 text-xs text-zinc-400 flex-shrink-0">
          <span>{article.source_name}</span>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">元記事 ↗</a>
          <button onClick={() => window.open(buildSearchUrl(article.title_ja || article.title, prefs.searchEngineNews), '_blank')}
            className="hover:text-blue-400 transition-colors">🔍 検索</button>
        </div>
        {/* 本文 */}
        <div className="flex-1 overflow-y-auto p-5" style={{ fontSize: fontSize + 'px', lineHeight: 1.85 }}>
          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-3 bg-zinc-700 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
              ))}
            </div>
          ) : content?.error ? (
            <div className="text-red-400 text-sm">取得失敗。<a href={article.url} target="_blank" className="underline">元サイトで読む ↗</a></div>
          ) : (
            <div className="animate-fade-up">
              {content?.top_image && (
                <img src={content.top_image} alt="" className="w-full rounded-xl mb-4 max-h-52 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
              )}
              <h2 className="text-lg font-bold mb-3 leading-snug">{title}</h2>
              <p className="whitespace-pre-wrap leading-relaxed">{body || '本文を取得できませんでした'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
