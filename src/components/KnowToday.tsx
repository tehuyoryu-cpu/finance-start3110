import { useEffect, useState } from 'react'
import { fetchNews, summarizeWithClaude } from '../services/api'

interface Article {
  title: string
  description: string
  url: string
  source: { name: string }
}

export default function KnowToday() {
  const [articles, setArticles] = useState<Article[]>([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNews('stock market finance')
      .then((data: Article[]) => {
        setArticles(data.slice(0, 5))
        setLoading(false)
        const headlines = data.slice(0, 5).map((a) => a.title).join('\n')
        setSummaryLoading(true)
        return summarizeWithClaude(headlines)
      })
      .then((s) => {
        setSummary(s)
        setSummaryLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
        setSummaryLoading(false)
      })
  }, [])

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-4">🔥 Know Today</h2>

      {summaryLoading && (
        <div className="bg-zinc-800 rounded-xl p-4 mb-4 text-sm text-zinc-400 animate-pulse">
          AI要約を生成中...
        </div>
      )}
      {summary && (
        <div className="bg-zinc-800 rounded-xl p-4 mb-4 text-sm text-zinc-200 whitespace-pre-line border border-zinc-700">
          <span className="text-xs text-blue-400 font-semibold block mb-1">✨ Claude AI Summary</span>
          {summary}
        </div>
      )}

      {loading && <div className="text-zinc-500 text-sm animate-pulse">ニュース取得中...</div>}
      {error && <div className="text-red-400 text-sm">エラー: {error}</div>}

      <div className="space-y-4">
        {articles.map((a) => (
          <div key={a.url} className="border-b border-zinc-800 pb-4">
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-base hover:text-blue-300 transition-colors"
            >
              {a.title}
            </a>
            <div className="text-zinc-400 mt-1 text-sm">{a.description}</div>
            <div className="text-zinc-600 text-xs mt-1">{a.source.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}