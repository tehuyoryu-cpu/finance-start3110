import { useEffect, useState } from 'react'
import { fetchQuote } from '../services/api'

const TICKERS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL']

export default function Watchlist() {
  const [stocks, setStocks] = useState<{ ticker: string; price: number; pct: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all(TICKERS.map(async (t) => {
      const q = await fetchQuote(t)
      return { ticker: t, price: q.c, pct: q.dp }
    }))
      .then((data) => { setStocks(data); setLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false) })
  }, [])

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-xl font-bold mb-4">⭐ Watchlist</h2>
      {loading && <div className="text-zinc-500 text-sm animate-pulse">取得中...</div>}
      {error && <div className="text-red-400 text-sm">⚠ {error}</div>}
      <div className="space-y-3">
        {stocks.map((s) => (
          <div key={s.ticker} className="flex justify-between items-center">
            <div>
              <div className="font-bold text-sm">{s.ticker}</div>
              <div className="text-xs text-zinc-500">${s.price?.toFixed(2)}</div>
            </div>
            <div className={`text-sm font-semibold ${s.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {s.pct >= 0 ? '+' : ''}{s.pct?.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}