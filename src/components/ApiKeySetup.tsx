import { useState, useEffect } from 'react'
import { getOpenRouterKeys, saveOpenRouterKeys } from '../services/api'

export function loadOpenRouterKey(): string {
  return getOpenRouterKeys()[0] || ''
}

export function hasOpenRouterKey(): boolean {
  return getOpenRouterKeys().length > 0
}

export default function ApiKeySetup({ onComplete }: { onComplete: () => void }) {
  const [keys, setKeys] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const existing = getOpenRouterKeys()
    setKeys(existing.length > 0 ? existing : [''])
  }, [])

  const updateKey = (i: number, val: string) => {
    setKeys(prev => { const n = [...prev]; n[i] = val; return n })
  }

  const addKey = () => setKeys(prev => [...prev, ''])

  const removeKey = (i: number) => {
    setKeys(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [''])
  }

  const handleSave = () => {
    setSaving(true)
    saveOpenRouterKeys(keys)
    setSaving(false)
    onComplete()
  }

  const keyCount = keys.filter(k => k.trim()).length

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📰</div>
          <h1 className="text-3xl font-bold text-white">Finance Start</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            OpenRouter APIキーを設定するとAI解説・翻訳が使えます
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-white">
              OpenRouter API Keys
              {keyCount > 0 && (
                <span className="ml-2 text-xs text-blue-400 font-normal">
                  {keyCount}件設定済み（ラウンドロビンで使用）
                </span>
              )}
            </label>
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline">
              無料取得 →
            </a>
          </div>

          <p className="text-xs text-zinc-500">
            複数キーを登録すると順番に使い回し、レート制限を分散できます。
          </p>

          <div className="space-y-2">
            {keys.map((k, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                  {i + 1}
                </div>
                <input
                  type="password"
                  value={k}
                  onChange={e => updateKey(i, e.target.value)}
                  placeholder="sk-or-v1-xxxxxxxxxxxxxxxx"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {keys.length > 1 && (
                  <button onClick={() => removeKey(i)}
                    className="text-zinc-500 hover:text-red-400 transition-colors text-sm flex-shrink-0">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addKey}
            className="w-full text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 rounded-lg py-2 transition-all">
            ＋ キーを追加
          </button>

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
          キーは localStorage に保存されます。
        </p>
      </div>
    </div>
  )
}
