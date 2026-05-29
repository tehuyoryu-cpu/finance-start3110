export default function KnowToday() {
  const news = [
    { title: 'NVIDIA earnings beat expectations', summary: 'AI demand remains strong across data centers.' },
    { title: 'BOJ policy concerns continue', summary: 'Markets watching for yen volatility.' },
    { title: 'Oil prices rise sharply', summary: 'Energy sector leading gains today.' }
  ]
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-4">🔥 Know Today</h2>
      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.title} className="border-b border-zinc-800 pb-4">
            <div className="font-semibold text-lg">{item.title}</div>
            <div className="text-zinc-400 mt-1">{item.summary}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
