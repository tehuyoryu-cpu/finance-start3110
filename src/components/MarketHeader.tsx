import { useEffect, useState } from 'react'
import { fetchQuote } from '../services/api'

const SYMBOLS = [
  { ticker: '^IXIC',  label: 'NASDAQ' },
  { ticker: '^N225',  label: '日経平均' },
  { ticker: 'JPY=X',  label: 'USD/JPY' },
  { ticker: 'BTC-USD',label: 'BTC' },
  { ticker: '^GSPC',  label: 'S&P 500' },
  { ticker: 'GC=F',   label: 'GOLD' },
]

export default function MarketHeader() {
  const [data, setData] = useState<Record<string, { price: number; changePercent: number; error?: string }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled(SYMBOLS.map(s => fetchQuote(s.ticker))).then(results => {
      const map: typeof data = {}
      results.forEach((r, i) => {
        const t = SYMBOLS[i].ticker
        if (r.status === 'fulfilled') {
          map[t] = { price: r.value.price, changePercent: r.value.changePercent }
        } else {
          map[t] = { price: 0, changePercent: 0, error: 'err' }
        }
      })
      setData(map)
      setLoading(false)
    })
    // 3分ごとに更新
    const timer = setInterval(() => {
      Promise.allSettled(SYMBOLS.map(s => fetchQuote(s.ticker))).then(results => {
        const map: typeof data = {}
        results.forEach((r, i) => {
          const t = SYMBOLS[i].ticker
          if (r.status === 'fulfilled') map[t] = { price: r.value.price, changePercent: r.value.changePercent }
        })
        setData(map)
      })
    }, 3 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {SYMBOLS.map(s => {
        const d = data[s.ticker]
        const isUp = (d?.changePercent ?? 0) >= 0
        return (
          <div key={s.ticker}
            className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-0.5">
            <div className="text-zinc-500 text-xs mb-1">{s.label}</div>
            {loading || !d ? (
              <div className="animate-shimmer h-5 w-20 rounded" />
            ) : (
              <>
                <div className="text-lg font-bold leading-tight">
                  {d.price > 0 ? d.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
                </div>
                <div className={`text-xs font-semibold mt-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(d.changePercent).toFixed(2)}%
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
