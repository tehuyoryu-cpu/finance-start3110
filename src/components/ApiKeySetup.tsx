import { useState, useEffect } from 'react'
import { saveOpenRouterKeys, loadOpenRouterKeys } from '../services/api'

export function hasOpenRouterKey(): boolean {
  try {
    // 新形式
    const raw = localStorage.getItem('openrouter_keys')
    if (raw) {
      const arr = JSON.parse(raw) as string[]
      if (Array.isArray(arr) && arr.some(Boolean)) return true
    }
    // 旧形式
    return !!localStorage.getItem('openrouter_key')
  } catch { return false }
}

export default function ApiKeySetup({ onComplete }: { onComplete: () => void }) {
  const [keys, setKeys] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loaded = loadOpenRouterKeys()
    setKeys(loaded.length > 0 ? loaded : [''])
  }, [])

  const updateKey = (i: number, val: string) => {
    const next = [...keys]
    next[i] = val
    setKeys(next)
  }

  const addKey = () => setKeys([...keys, ''])

  const removeKey = (i: number) => {
    if (keys.length === 1) return
    setKeys(keys.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    setSaving(true)
    const filtered = keys.map(k => k.trim()).filter(Boolean)
    saveOpenRouterKeys(filtered)
    setSaving(false)
    onComplete()
  }

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

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-white">
                OpenRouter API キー
              </label>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline">
                無料取得 →
              </a>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              複数キーを登録するとラウンドロビンで使い回し、レート制限を分散します。
              キーの数に比例してリクエスト数が増えます。
            </p>

            <div className="space-y-2">
              {keys.map((k, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">
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
                      className="text-zinc-600 hover:text-red-400 transition-colors text-lg leading-none">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addKey}
              className="mt-3 w-full text-xs text-zinc-400 hover:text-blue-400 border border-dashed border-zinc-700 hover:border-blue-500 rounded-lg py-2 transition-all">
              ＋ キーを追加
            </button>

            {keys.filter(Boolean).length > 1 && (
              <div className="mt-3 bg-blue-950/50 border border-blue-800/50 rounded-lg px-3 py-2 text-xs text-blue-300">
                ✨ {keys.filter(Boolean).length}個のキーを登録。
                レート制限が{keys.filter(Boolean).length}倍に緩和されます。
              </div>
            )}
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
          キーは localStorage に保存されます。
        </p>
      </div>
    </div>
  )
}
