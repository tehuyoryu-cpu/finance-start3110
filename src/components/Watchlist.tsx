import { useEffect, useState, useRef } from 'react'
import { fetchStockTickers, saveStockTickers, fetchQuote, type StockData } from '../services/api'

export default function Watchlist() {
  const [tickers, setTickers]     = useState<string[]>([])
  const [stocks, setStocks]       = useState<Record<string, StockData & { flash?: 'up' | 'down' }>>({})
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(true)
  const prevPrices                = useRef<Record<string, number>>({})
  const timerRef                  = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    fetchStockTickers().then(t => {
      setTickers(t)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!tickers.length) return
    const refresh = async () => {
      const results = await Promise.allSettled(tickers.map(t => fetchQuote(t)))
      setStocks(prev => {
        const next = { ...prev }
        results.forEach((r, i) => {
          const t = tickers[i]
          if (r.status === 'fulfilled') {
            const price = r.value.price
            const prev  = prevPrices.current[t]
            const flash = prev != null ? (price > prev ? 'up' : price < prev ? 'down' : undefined) : undefined
            prevPrices.current[t] = price
            next[t] = { ...r.value, flash }
          }
        })
        return next
      })
    }
    refresh()
    timerRef.current = setInterval(refresh, 3 * 60 * 1000)
    return () => clearInterval(timerRef.current)
  }, [tickers])

  const addTicker = async () => {
    const t = input.trim().toUpperCase()
    if (!t || tickers.includes(t)) return
    const next = [...tickers, t]
    setTickers(next)
    await saveStockTickers(next)
    setInput('')
    setStocks(prev => ({ ...prev, [t]: { ticker: t, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0 } }))
    fetchQuote(t).then(d => setStocks(prev => ({ ...prev, [t]: d }))).catch(() => {})
  }

  const removeTicker = async (t: string) => {
    const next = tickers.filter(x => x !== t)
    setTickers(next)
    await saveStockTickers(next)
    setStocks(prev => { const n = { ...prev }; delete n[t]; return n })
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
      <h2 className="text-lg font-bold mb-4">⭐ ウォッチリスト</h2>

      {/* 追加フォーム */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTicker()}
          placeholder="AAPL / 7203.T / ^N225"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none transition-colors"
        />
        <button onClick={addTicker}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95">
          追加
        </button>
      </div>

      {loading && <div className="text-zinc-500 text-xs animate-pulse">読み込み中...</div>}

      <div className="space-y-2 stagger">
        {tickers.map(t => {
          const s = stocks[t]
          const pct = s?.changePercent ?? 0
          const isUp = pct >= 0
          return (
            <div key={t}
              className={`animate-fade-up flex items-center gap-2 p-2 rounded-xl transition-all
                ${s?.flash === 'up' ? 'flash-green' : s?.flash === 'down' ? 'flash-red' : ''}
                hover:bg-zinc-800`}>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{t}</div>
                <div className="text-xs text-zinc-500">
                  {s?.price ? `$${s.price.toFixed(2)}` : '---'}
                </div>
              </div>
              <div className={`text-sm font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '+' : ''}{pct.toFixed(2)}%
              </div>
              <button onClick={() => removeTicker(t)}
                className="text-zinc-600 hover:text-red-400 text-xs transition-colors ml-1">✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
