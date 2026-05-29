import { useEffect, useState } from 'react'
import { fetchQuote } from '../services/api'

interface StockData {
  ticker: string
  price: number
  change: number
  pct: number
}

const TICKERS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL']

export default function Watchlist() {
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all(
      TICKERS.map(async (ticker) => {
        const q = await fetchQuote(ticker)
        return {
          ticker,
          price: q.c,
          change: q.d,
          pct: q.dp,
        }
      })
    ).then((data) => {
      setStocks(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-xl font-bold mb-4">⭐ Watchlist</h2>
      {loading && <div className="text-zinc-500 text-sm">取得中...</div>}
      <div className="space-y-3">
        {stocks.map((s) => (
          <div key={s.ticker} className="flex justify-between items-center">
            <div>
              <div className="font-bold">{s.ticker}</div>
              <div className="text-xs text-zinc-500">${s.price?.toFixed(2)}</div>
            </div>
            <div className={s.pct >= 0 ? 'text-green-400' : 'text-red-400'}>
              {s.pct >= 0 ? '+' : ''}{s.pct?.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}