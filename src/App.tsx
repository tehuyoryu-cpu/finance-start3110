import { useState, useEffect } from 'react'
import { hasAllKeys } from './services/api'
import ApiKeySetup from './components/ApiKeySetup'
import MarketHeader from './components/MarketHeader'
import KnowToday from './components/KnowToday'
import SectorChart from './components/SectorChart'
import EarningsHub from './components/EarningsHub'
import EconomicCalendar from './components/EconomicCalendar'
import NewsCluster from './components/NewsCluster'
import Watchlist from './components/Watchlist'

export default function App() {
  const [ready, setReady] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    setReady(hasAllKeys())
  }, [])

  if (!ready || showSetup) {
    return (
      <ApiKeySetup
        onComplete={() => {
          setReady(true)
          setShowSetup(false)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setShowSetup(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg px-3 py-1"
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