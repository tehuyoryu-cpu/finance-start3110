import MarketHeader from './MarketHeader'
import KnowToday from './KnowToday'
import SectorChart from './SectorChart'
import EarningsHub from './EarningsHub'
import EconomicCalendar from './EconomicCalendar'
import NewsCluster from './NewsCluster'
import Watchlist from './Watchlist'
import { useState } from 'react'
import ApiKeySetup from './ApiKeySetup'

export default function Dashboard() {
  const [showSetup, setShowSetup] = useState(false)

  if (showSetup) {
    return <ApiKeySetup onComplete={() => setShowSetup(false)} />
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-300">📈 AI Market Discover</h1>
          <button
            onClick={() => setShowSetup(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg px-3 py-1 transition-colors"
          >
            ⚙️ APIキー設定
          </button>
        </div>
        <MarketHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <KnowToday />
            <SectorChart />
            <NewsCluster />
          </div>
          <div className="space-y-6">
            <Watchlist />
            <EarningsHub />
            <EconomicCalendar />
          </div>
        </div>
      </div>
    </div>
  )
}