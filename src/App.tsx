import MarketHeader from './components/MarketHeader'
import KnowToday from './components/KnowToday'
import SectorChart from './components/SectorChart'
import EarningsHub from './components/EarningsHub'
import EconomicCalendar from './components/EconomicCalendar'
import NewsCluster from './components/NewsCluster'
import Watchlist from './components/Watchlist'

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
