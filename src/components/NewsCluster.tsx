export default function NewsCluster() {
  const clusters = [
    { topic: 'NVIDIA Earnings', count: 14, summary: 'Strong AI demand boosted earnings outlook.' },
    { topic: 'Oil Prices', count: 8, summary: 'Energy sector rises with crude prices.' },
    { topic: 'BOJ Policy', count: 6, summary: 'Markets cautious about yen volatility.' }
  ]
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-6">📰 Clustered News</h2>
      <div className="space-y-4">
        {clusters.map((cluster) => (
          <div key={cluster.topic} className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
            <div className="flex justify-between items-center">
              <div className="font-bold text-lg">{cluster.topic}</div>
              <div className="text-sm text-zinc-400">{cluster.count} articles</div>
            </div>
            <div className="text-zinc-400 mt-2">{cluster.summary}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
