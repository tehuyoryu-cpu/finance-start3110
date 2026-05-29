export default function Watchlist() {
  const stocks = [
    { ticker: 'NVDA', move: '+5.1%' },
    { ticker: 'AAPL', move: '+1.3%' },
    { ticker: 'TSLA', move: '-2.1%' }
  ]
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-xl font-bold mb-4">⭐ Watchlist</h2>
      <div className="space-y-3">
        {stocks.map((stock) => (
          <div key={stock.ticker} className="flex justify-between">
            <div>{stock.ticker}</div>
            <div>{stock.move}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
