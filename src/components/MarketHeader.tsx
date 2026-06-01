import { useEffect, useState } from 'react'
import { fetchQuote } from '../services/api'

const SYMBOLS = [
  { ticker: '^N225',   label: '日経平均',  flag: '🇯🇵' },
  { ticker: '^GSPC',   label: 'S&P 500',   flag: '🇺🇸' },
  { ticker: '^IXIC',   label: 'NASDAQ',    flag: '🇺🇸' },
  { ticker: '^DJI',    label: 'ダウ',      flag: '🇺🇸' },
  { ticker: 'JPY=X',   label: 'USD/JPY',   flag: '💴' },
  { ticker: 'BTC-USD', label: 'BTC',       flag: '₿' },
  { ticker: 'GC=F',    label: 'GOLD',      flag: '🥇' },
  { ticker: '^TNX',    label: '米10年債',  flag: '📊' },
]

type QuoteState = {
  price: number
  changePercent: number
  error?: string
  loading: boolean
}

export default function MarketHeader() {
  const [data, setData] = useState<Record<string, QuoteState>>(
    Object.fromEntries(SYMBOLS.map(s => [s.ticker, { price: 0, changePercent: 0, loading: true }]))
  )

  const refresh = async () => {
    // 並列fetchだと全部CORSエラーになりやすいので少し間隔をあける
    for (const s of SYMBOLS) {
      fetchQuote(s.ticker).then(q => {
        setData(prev => ({
          ...prev,
          [s.ticker]: {
            price: q.price,
            changePercent: q.changePercent,
            error: q.error,
            loading: false,
          }
        }))
      }).catch(() => {
        setData(prev => ({
          ...prev,
          [s.ticker]: { price: 0, changePercent: 0, error: 'err', loading: false }
        }))
      })
    }
  }

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 3 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {SYMBOLS.map(s => {
        const d = data[s.ticker]
        const isUp = (d?.changePercent ?? 0) >= 0
        const hasData = d && !d.loading && d.price > 0

        return (
          <div key={s.ticker}
            className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-sm">{s.flag}</span>
              <span className="text-zinc-500 text-xs truncate">{s.label}</span>
            </div>
            {d?.loading ? (
              <div className="animate-shimmer h-5 w-16 rounded" />
            ) : !hasData ? (
              <div className="text-zinc-600 text-xs">---</div>
            ) : (
              <>
                <div className="text-base font-bold leading-tight tabular-nums">
                  {s.ticker === 'JPY=X'
                    ? d.price.toFixed(2)
                    : d.price >= 1000
                      ? d.price.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
                      : d.price.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
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
