import { useState, useEffect } from 'react'
import { hasOpenRouterKey } from './components/ApiKeySetup'
import ApiKeySetup from './components/ApiKeySetup'
import Dashboard from './components/Dashboard'

export default function App() {
  const [status, setStatus] = useState<'loading' | 'setup' | 'ready'>('loading')

  useEffect(() => {
    // OpenRouterキーがあればそのままready、なければsetup画面（スキップ可能）
    const ok = hasOpenRouterKey()
    setStatus(ok ? 'ready' : 'setup')
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm animate-pulse">起動中...</div>
      </div>
    )
  }

  if (status === 'setup') {
    return <ApiKeySetup onComplete={() => setStatus('ready')} />
  }

  return <Dashboard />
}
