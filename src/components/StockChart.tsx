import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { fetchChart, fetchQuote, type ChartPoint, type StockData } from '../services/api'

const RANGES = [
  { label: '1D', range: '1d',  interval: '5m'  },
  { label: '5D', range: '5d',  interval: '15m' },
  { label: '1M', range: '1mo', interval: '1d'  },
  { label: '3M', range: '3mo', interval: '1d'  },
  { label: '1Y', range: '1y',  interval: '1wk' },
  { label: '5Y', range: '5y',  interval: '1mo' },
]

interface Props {
  ticker: string
  onClose?: () => void
}

export default function StockChart({ ticker, onClose }: Props) {
  const [points, setPoints]   = useState<ChartPoint[]>([])
  const [quote, setQuote]     = useState<StockData | null>(null)
  const [range, setRange]     = useState(RANGES[2])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      fetchChart(ticker, range.range, range.interval),
      fetchQuote(ticker),
    ]).then(([chart, q]) => {
      if (chart.error) { setError(chart.error); setLoading(false); return }
      setPoints(chart.points)
      setQuote(q)
      setLoading(false)
    }).catch(e => {
      setError(e.message)
      setLoading(false)
    })
  }, [ticker, range])

  const isUp = (quote?.changePercent ?? 0) >= 0
  const color = isUp ? '#4ade80' : '#f87171'

  const fmt = (t: number) => {
    const d = new Date(t)
    if (range.range === '1d' || range.range === '5d') {
      return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  }

  const minVal = points.length ? Math.min(...points.map(p => p.close)) * 0.999 : 0
  const maxVal = points.length ? Math.max(...points.map(p => p.close)) * 1.001 : 0

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 animate-fade-scale">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{ticker}</h2>
            {quote?.shortName && <span className="text-xs text-zinc-500">{quote.shortName}</span>}
            {quote?.marketState && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                quote.marketState === 'REGULAR' ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {quote.marketState === 'REGULAR' ? '市場開場中' : '市場閉場'}
              </span>
            )}
          </div>
          {quote && (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold">
                {quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-zinc-400">{quote.currency}</span>
              <span className={`text-sm font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '+' : ''}{quote.change.toFixed(2)} ({isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
          {quote && (
            <div className="flex gap-4 mt-1 text-xs text-zinc-500">
              <span>高: {quote.high.toFixed(2)}</span>
              <span>安: {quote.low.toFixed(2)}</span>
              <span>始値: {quote.open.toFixed(2)}</span>
              <span>前日終値: {quote.prevClose.toFixed(2)}</span>
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
        )}
      </div>

      {/* レンジ切替 */}
      <div className="flex gap-1 mb-4">
        {RANGES.map(r => (
          <button key={r.label}
            onClick={() => setRange(r)}
            className={`text-xs px-3 py-1 rounded-lg transition-all hover:scale-105 active:scale-95 ${
              range.label === r.label
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* チャート */}
      <div className="h-56">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-400 text-sm">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="t" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#71717a' }}
                     tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis domain={[minVal, maxVal]} tick={{ fontSize: 10, fill: '#71717a' }}
                     tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(0)} width={50} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                labelFormatter={v => new Date(v as number).toLocaleString('ja-JP')}
                formatter={(v: number) => [v.toFixed(2), 'Close']}
              />
              <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2}
                    fill={`url(#grad-${ticker})`} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
