import { useState, useEffect } from 'react'
import MarketHeader from './MarketHeader'
import KnowToday from './KnowToday'
import NewsPanel from './NewsPanel'
import Watchlist from './Watchlist'
import SettingsPanel from './SettingsPanel'
import ApiKeySetup from './ApiKeySetup'
import { fetchPrefs, type Prefs } from '../services/api'

const DEFAULT_PREFS: Prefs = {
  searchEngine: 'google',
  searchEngineNews: 'google',
  readerTheme: 'dark',
  readerFontSize: 15,
}

type Tab = 'news' | 'market'

export default function Dashboard() {
  const [tab, setTab]             = useState<Tab>('news')
  const [showSetup, setShowSetup] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [prefs, setPrefs]         = useState<Prefs>(DEFAULT_PREFS)

  useEffect(() => {
    fetchPrefs().then(p => setPrefs(p)).catch(() => {})
  }, [])

  if (showSetup) {
    return <ApiKeySetup onComplete={() => setShowSetup(false)} />
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-4">
          <h1 className="text-sm font-bold text-zinc-200 flex-shrink-0">📰 Finance Start</h1>

          {/* タブ */}
          <div className="flex gap-1">
            {([['news','ニュース'],['market','マーケット']] as [Tab,string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  tab === t
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* 右側ボタン */}
          <button onClick={() => setShowSettings(true)}
            className="text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-1.5 transition-all">
            ⚙ 設定
          </button>
          <button onClick={() => setShowSetup(true)}
            className="text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-1.5 transition-all">
            🔑 APIキー管理管理
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* マーケットヘッダー（常時表示） */}
        <MarketHeader />

        {/* ニュースタブ */}
        {tab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up">
            <div className="lg:col-span-2">
              <NewsPanel prefs={prefs} />
            </div>
            <div className="space-y-4">
              <KnowToday />
              <Watchlist />
            </div>
          </div>
        )}

        {/* マーケットタブ */}
        {tab === 'market' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up">
            <div className="lg:col-span-2 space-y-4">
              <Watchlist />
            </div>
            <div className="space-y-4">
              <KnowToday />
            </div>
          </div>
        )}
      </main>

      {/* 設定パネル */}
      {showSettings && (
        <SettingsPanel
          prefs={prefs}
          onUpdate={setPrefs}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
