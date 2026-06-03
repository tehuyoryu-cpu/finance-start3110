import { useState, useEffect } from 'react'
import ApiKeySetup from './components/ApiKeySetup'
import Dashboard from './components/Dashboard'

const SKIP_KEY = 'setup_skipped'

export default function App() {
  const [ready, setReady] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    const hasKey     = !!localStorage.getItem('openrouter_key')
    const hasSkipped = !!localStorage.getItem(SKIP_KEY)
    if (hasKey || hasSkipped) {
      setReady(true)
    } else {
      setShowSetup(true)
    }
  }, [])

  if (!ready && !showSetup) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm animate-pulse">起動中...</div>
      </div>
    )
  }

  if (showSetup) {
    return <ApiKeySetup onComplete={() => {
      localStorage.setItem(SKIP_KEY, '1')
      setShowSetup(false)
      setReady(true)
    }} />
  }

  return <Dashboard />
}
