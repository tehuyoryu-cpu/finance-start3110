export default function MarketHeader() {
  const data = [
    { name: 'NASDAQ', value: '+1.2%' },
    { name: 'NIKKEI', value: '-0.4%' },
    { name: 'USD/JPY', value: '157.3' },
    { name: 'BTC', value: '$108k' }
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.map((item) => (
        <div key={item.name} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <div className="text-zinc-400 text-sm">{item.name}</div>
          <div className="text-2xl font-bold mt-2">{item.value}</div>
        </div>
      ))}
    </div>
  )
}
