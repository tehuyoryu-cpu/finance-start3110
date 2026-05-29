import { useEffect, useState } from 'react'
import { fetchNews, summarizeWithClaude } from '../services/api'

export default function KnowToday() {
  const [articles, setArticles] = useState<{ title: string; description: string; url: string; source: { name: string } }[]>([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNews('stock market finance')
      .then((data) => {
        const top = data.slice(0, 5)
        setArticles(top)
        setLoading(false)
        setSummaryLoading(true)
        return summarizeWithClaude(top.map((a: { title: string }) => a.title).join('\n'))
      })
      .then((s) => { setSummary(s); setSummaryLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false); setSummaryLoading(false) })
  }, [])

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-4">🔥 Know Today</h2>
      {summaryLoading && <div className="bg-zinc-800 rounded-xl p-4 mb-4 text-sm text-zinc-400 animate-pulse">AI要約を生成中...</div>}
      {summary && (
        <div className="bg-zinc-800 rounded-xl p-4 mb-4 text-sm text-zinc-200 whitespace-pre-line border border-zinc-700">
          <span className="text-xs text-blue-400 font-semibold block mb-1">✨ Claude AI Summary</span>
          {summary}
        </div>
      )}
      {loading && <div className="text-zinc-500 text-sm animate-pulse">ニュース取得中...</div>}
      {error && <div className="text-red-400 text-sm">⚠ {error}</div>}
      <div className="space-y-4">
        {articles.map((a) => (
          <div key={a.url} className="border-b border-zinc-800 pb-4 last:border-0">
            <a href={a.url} target="_blank" rel="noopener noreferrer"
              className="font-semibold text-base hover:text-blue-300 transition-colors line-clamp-2">{a.title}</a>
            <p className="text-zinc-400 mt-1 text-sm line-clamp-2">{a.description}</p>
            <span className="text-zinc-600 text-xs">{a.source.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}