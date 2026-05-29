export default function EarningsHub() {
  const earnings = [
    { ticker: 'NVDA', eps: '5.48', expected: '5.12' },
    { ticker: 'AAPL', eps: '1.64', expected: '1.59' }
  ]
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-xl font-bold mb-4">📈 Earnings Hub</h2>
      <div className="space-y-4">
        {earnings.map((item) => (
          <div key={item.ticker}>
            <div className="font-bold">{item.ticker}</div>
            <div className="text-sm text-zinc-400">EPS {item.eps} / Expected {item.expected}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
