import { useEffect, useState } from 'react'
import { fetchNews, summarizeWithAI } from '../services/api'

export default function KnowToday() {
  const [headlines, setHeadlines] = useState<string[]>([])
  const [summary, setSummary]     = useState('')
  const [loading, setLoading]     = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetchNews({ limit: 6, lang: 'en' }).then(data => {
      const titles = data.articles.map(a => a.title_ja || a.title).slice(0, 6)
      setHeadlines(titles)
      setLoading(false)
      setAiLoading(true)
      return summarizeWithAI(titles.join('\n'))
    }).then(s => {
      setSummary(s)
      setAiLoading(false)
    }).catch(() => {
      setLoading(false)
      setAiLoading(false)
    })
  }, [])

  return (
    <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
      <h2 className="text-lg font-bold mb-3">🔥 今日のニュース要約</h2>

      {aiLoading && (
        <div className="bg-zinc-800 rounded-xl p-3 mb-3 text-xs text-zinc-400 animate-pulse border border-zinc-700">
          ✨ Qwen3 AI が要約中...
        </div>
      )}
      {summary && (
        <div className="animate-fade-up bg-zinc-800 rounded-xl p-3 mb-3 text-sm text-zinc-200 whitespace-pre-line border border-zinc-700">
          <span className="text-xs text-blue-400 font-semibold block mb-1">✨ AI Summary (Qwen3)</span>
          {summary}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-shimmer h-3 rounded w-full" />
          ))}
        </div>
      ) : (
        <ul className="space-y-1.5 stagger">
          {headlines.map((h, i) => (
            <li key={i} className="animate-fade-up text-xs text-zinc-400 flex gap-2">
              <span className="text-zinc-600 flex-shrink-0">·</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
