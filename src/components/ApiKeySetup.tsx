import { useState, useEffect } from 'react'

const MAX_KEYS = 5

export function loadOpenRouterKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < MAX_KEYS; i++) {
    const k = localStorage.getItem(`openrouter_key_${i}`)
    if (k) keys.push(k)
  }
  // 後方互換
  const legacy = localStorage.getItem('openrouter_key')
  if (legacy && !keys.includes(legacy)) keys.unshift(legacy)
  return keys
}

export function saveOpenRouterKeys(keys: string[]): void {
  // 既存を全削除
  for (let i = 0; i < MAX_KEYS; i++) {
    localStorage.removeItem(`openrouter_key_${i}`)
  }
  // 新規保存
  keys.filter(Boolean).forEach((k, i) => {
    localStorage.setItem(`openrouter_key_${i}`, k.trim())
  })
  // 後方互換: 1つ目を旧キーにも保存
  if (keys[0]) localStorage.setItem('openrouter_key', keys[0].trim())
  else localStorage.removeItem('openrouter_key')
}

export function hasOpenRouterKey(): boolean {
  return loadOpenRouterKeys().length > 0
}

export default function ApiKeySetup({ onComplete }: { onComplete: () => void }) {
  const [keys, setKeys] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)
  const [keyCount, setKeyCount] = useState(1)

  useEffect(() => {
    const saved = loadOpenRouterKeys()
    if (saved.length > 0) {
      setKeys(saved)
      setKeyCount(saved.length)
    }
  }, [])

  const updateKey = (i: number, val: string) => {
    setKeys(prev => {
      const next = [...prev]
      next[i] = val
      return next
    })
  }

  const addKey = () => {
    if (keyCount >= MAX_KEYS) return
    setKeyCount(c => c + 1)
    setKeys(prev => [...prev, ''])
  }

  const removeKey = (i: number) => {
    setKeys(prev => prev.filter((_, idx) => idx !== i))
    setKeyCount(c => Math.max(1, c - 1))
  }

  const handleSave = () => {
    setSaving(true)
    saveOpenRouterKeys(keys.filter(k => k.trim()))
    setSaving(false)
    onComplete()
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📰</div>
          <h1 className="text-3xl font-bold text-white">Finance Start</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            OpenRouter APIキーを設定するとAI解説・翻訳が使えます
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-5">

          {/* 説明 */}
          <div className="bg-zinc-800 rounded-xl p-4 text-xs text-zinc-400 space-y-1">
            <p>🔄 <span className="text-zinc-200 font-semibold">複数キーのラウンドロビン</span> — キーを複数登録すると順番に使い回し、レート制限を分散します</p>
            <p>🆓 <span className="text-zinc-200 font-semibold">無料モデル使用</span> — Qwen3・GPT-OSS・Gemma等の無料モデルを使用</p>
            <p>🔑 <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">openrouter.ai/keys</a> で無料取得できます</p>
          </div>

          {/* キー入力欄 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white">
                APIキー ({keys.filter(k=>k.trim()).length}/{MAX_KEYS})
              </label>
              {keyCount < MAX_KEYS && (
                <button onClick={addKey}
                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 rounded-lg px-3 py-1 transition-all">
                  ＋ キーを追加
                </button>
              )}
            </div>

            {Array.from({ length: keyCount }).map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 font-bold">
                  {i + 1}
                </div>
                <input
                  type="password"
                  value={keys[i] || ''}
                  onChange={e => updateKey(i, e.target.value)}
                  placeholder={`sk-or-v1-${'x'.repeat(16)} (キー ${i + 1})`}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {keyCount > 1 && (
                  <button onClick={() => removeKey(i)}
                    className="text-zinc-600 hover:text-red-400 transition-colors text-lg flex-shrink-0">
                    ✕
                  </button>
                )}
              </div>
            ))}

            {keyCount < MAX_KEYS && (
              <p className="text-xs text-zinc-600 text-center">
                最大{MAX_KEYS}個まで登録可能 — 多いほどレート制限を回避しやすくなります
              </p>
            )}
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            {saving ? '保存中...' : `${keys.filter(k=>k.trim()).length > 0 ? keys.filter(k=>k.trim()).length + '個のキーで' : ''}ダッシュボードを開く`}
          </button>

          <button onClick={onComplete}
            className="w-full text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            スキップ（キーなしで続ける）
          </button>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-4">
          キーは localStorage に保存されます。外部には送信されません。
        </p>
      </div>
    </div>
  )
}
