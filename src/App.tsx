import { useState, useEffect } from 'react'
import ApiKeySetup from './components/ApiKeySetup'
import Dashboard from './components/Dashboard'

// Chrome拡張 & ブラウザ両対応
async function checkKeys(): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['api_finnhub', 'api_gnews', 'api_claude'], (result) => {
          resolve(!!(result.api_finnhub && result.api_gnews && result.api_claude))
        })
      })
    }
    // ブラウザ（npm run dev）
    return !!(
      localStorage.getItem('api_finnhub') &&
      localStorage.getItem('api_gnews') &&
      localStorage.getItem('api_claude')
    )
  } catch {
    return false
  }
}

export default function App() {
  const [status, setStatus] = useState<'loading' | 'setup' | 'ready'>('loading')

  useEffect(() => {
    checkKeys().then((ok) => setStatus(ok ? 'ready' : 'setup'))
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">起動中...</div>
      </div>
    )
  }

  if (status === 'setup') {
    return <ApiKeySetup onComplete={() => setStatus('ready')} />
  }

  return <Dashboard />
}