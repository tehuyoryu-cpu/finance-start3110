import { useState, useEffect } from 'react'

const STORAGE_KEY = 'openrouter_key'

export function loadOpenRouterKey(): string {
  return localStorage.getItem(STORAGE_KEY) || (import.meta as { env?: { VITE_OPENROUTER_KEY?: string } }).env?.VITE_OPENROUTER_KEY || ''
}

export function saveOpenRouterKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key)
}

export function hasOpenRouterKey(): boolean {
  return !!loadOpenRouterKey()
}

export default function ApiKeySetup({ onComplete }: { onComplete: () => void }) {
  const [key, setKey]     = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setKey(loadOpenRouterKey())
  }, [])

  async function handleSave() {
    setSaving(true)
    saveOpenRouterKey(key.trim())
    setSaving(false)
    onComplete()
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📰</div>
          <h1 className="text-3xl font-bold text-white">Finance Start</h1>
          <p className="text-zinc-400 mt-2 text-sm">OpenRouter APIキーを設定するとAI要約が使えます（任意）</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-white">OpenRouter API Key</label>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline">無料取得 →</a>
            </div>
            <p className="text-xs text-zinc-500 mb-2">
              Qwen3 Next 80B（free）でAI要約を生成します。キーなしでもニュース閲覧は可能です。
            </p>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="sk-or-v1-xxxxxxxxxxxxxxxx"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            {saving ? '保存中...' : 'ダッシュボードを開く'}
          </button>
          <button onClick={onComplete}
            className="w-full text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            スキップ（キーなしで続ける）
          </button>
        </div>
        <p className="text-center text-zinc-600 text-xs mt-4">
          キーは localStorage に保存されます。.env の VITE_OPENROUTER_KEY でも設定可能。
        </p>
      </div>
    </div>
  )
}
