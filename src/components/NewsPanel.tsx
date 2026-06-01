import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchNews, buildSearchUrl, type NewsArticle, type Prefs } from '../services/api'

const CATEGORIES = [
  { value: '',               label: '全て' },
  { value: 'culture',       label: '🌐 カルチャー' },
  { value: 'tech',          label: '💻 テック' },
  { value: 'business',      label: '📈 ビジネス' },
  { value: 'game',          label: '🎮 ゲーム' },
  { value: 'anime',         label: '🎌 アニメ' },
  { value: 'entertainment', label: '🎬 エンタメ' },
  { value: 'music',         label: '🎵 音楽' },
  { value: 'science',       label: '🔬 科学' },
]

const BADGE_COLORS: Record<string, string> = {
  culture: 'bg-purple-600', tech: 'bg-green-700', business: 'bg-blue-700',
  game: 'bg-orange-600', anime: 'bg-amber-600', entertainment: 'bg-pink-700',
  music: 'bg-yellow-700', science: 'bg-teal-700',
}

interface Props { prefs: Prefs }

export default function NewsPanel({ prefs }: Props) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [category, setCategory] = useState('')
  const [lang, setLang]         = useState('')
  const [q, setQ]               = useState('')
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [reader, setReader]     = useState<NewsArticle | null>(null)
  const searchTimer             = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchNews({ category, lang, q, page: p, limit: 20 })
      setArticles(data.articles)
      setTotal(data.total)
      setPages(data.pages)
      setPage(p)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
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

      {/* エラー表示 */}
      {error && (
        <div className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
          取得エラー: {error}
        </div>
      )}

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
      ) : articles.length === 0 ? (
        <div className="text-center text-zinc-500 text-sm py-12">
          <div className="text-3xl mb-2">📭</div>
          <div>記事が見つかりません</div>
          <div className="text-xs mt-1 text-zinc-600">フィルターを変えるか、しばらく待ってから再試行してください</div>
          <button onClick={() => load(1)} className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
            再読み込み
          </button>
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
                  {a.pub_date ? new Date(a.pub_date * 1000).toLocaleDateString('ja-JP', {
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : ''}
                </span>
              </div>
              <p className="font-semibold text-sm text-zinc-100 leading-snug">{a.title}</p>
              {a.description && (
                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {a.description}
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
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-xs transition-all hover:scale-105 active:scale-95">◀</button>
          <span className="text-xs text-zinc-400">{page} / {pages}（{total}件）</span>
          <button onClick={() => load(Math.min(pages, page + 1))} disabled={page >= pages}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-xs transition-all hover:scale-105 active:scale-95">▶</button>
        </div>
      )}

      {/* リーダーモーダル */}
      {reader && (
        <ReaderModal article={reader} prefs={prefs} onClose={() => setReader(null)} />
      )}
    </div>
  )
}

// ─── リーダーモーダル（descriptionベース、本文はCORS制限で取得不可） ─────────
function ReaderModal({ article, prefs, onClose }: {
  article: NewsArticle; prefs: Prefs; onClose: () => void
}) {
  const [theme, setTheme]       = useState(prefs.readerTheme || 'dark')
  const [fontSize, setFontSize] = useState(prefs.readerFontSize || 15)

  const themeClass = theme === 'light' ? 'bg-white text-zinc-900'
                   : theme === 'sepia' ? 'bg-amber-50 text-amber-900'
                   : 'bg-zinc-900 text-zinc-100'

  // Escキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`animate-pop-in w-full max-w-2xl max-h-[88vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl ${themeClass}`}>
        {/* ヘッダー */}
        <div className="flex items-center gap-2 p-3 bg-zinc-950 text-white flex-shrink-0">
          <span className="flex-1 text-xs font-bold truncate">{article.title}</span>
          <div className="flex gap-1 flex-shrink-0">
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
        <div className="flex gap-3 items-center px-4 py-2 bg-zinc-800 text-xs text-zinc-400 flex-shrink-0 flex-wrap">
          <span className="font-semibold text-zinc-300">{article.source_name}</span>
          {article.pub_date && (
            <span>{new Date(article.pub_date * 1000).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          )}
          <a href={article.url} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-blue-400 hover:text-blue-300 transition-colors font-semibold">
            全文を読む ↗
          </a>
          <button
            onClick={() => window.open(buildSearchUrl(article.title, prefs.searchEngineNews), '_blank')}
            className="hover:text-blue-400 transition-colors">
            🔍 検索
          </button>
        </div>

        {/* 本文エリア */}
        <div className="flex-1 overflow-y-auto p-6" style={{ fontSize: fontSize + 'px', lineHeight: 1.85 }}>
          <div className="animate-fade-up">
            {/* サムネイル */}
            {article.top_image && (
              <img
                src={article.top_image} alt=""
                className="w-full rounded-xl mb-5 max-h-56 object-cover"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}

            {/* タイトル */}
            <h2 className="text-xl font-bold mb-4 leading-snug">{article.title}</h2>

            {/* description（RSSから取得済み） */}
            {article.description ? (
              <p className="leading-relaxed text-zinc-300 mb-6">{article.description}</p>
            ) : (
              <p className="text-zinc-500 italic mb-4">概要は取得できませんでした。</p>
            )}

            {/* 全文リンク */}
            <a href={article.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95">
              全文を読む（{article.source_name}）↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
