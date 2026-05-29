import { useState } from 'react'
import { saveKeys, getKeys } from '../services/api'

interface Props {
  onComplete: () => void
}

export default function ApiKeySetup({ onComplete }: Props) {
  const existing = getKeys()
  const [keys, setKeys] = useState({
    finnhub: existing.finnhub,
    gnews: existing.gnews,
    claude: existing.claude,
  })
  const [error, setError] = useState('')

  function handleSave() {
    if (!keys.finnhub || !keys.gnews || !keys.claude) {
      setError('すべてのAPIキーを入力してください')
      return
    }
    saveKeys(keys)
    onComplete()
  }

  const fields = [
    {
      key: 'finnhub' as const,
      label: 'Finnhub API Key',
      desc: '株価データ（無料）',
      link: 'https://finnhub.io/register',
      placeholder: 'ck_xxxxxxxxxxxx',
    },
    {
      key: 'gnews' as const,
      label: 'GNews API Key',
      desc: 'ニュース取得（無料 100req/日）',
      link: 'https://gnews.io/register',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    {
      key: 'claude' as const,
      label: 'Anthropic API Key',
      desc: 'AI要約 Claude Haiku（無料枠あり）',
      link: 'https://console.anthropic.com/',
      placeholder: 'sk-ant-xxxxxxxxxxxx',
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📈</div>
          <h1 className="text-3xl font-bold text-white">AI Market Discover</h1>
          <p className="text-zinc-400 mt-2">APIキーを設定してダッシュボードを開始</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-5">
          {fields.map((f) => (
            <div key={f.key}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-white">{f.label}</label>
                <a
                  href={f.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  無料取得 →
                </a>
              </div>
              <p className="text-xs text-zinc-500 mb-2">{f.desc}</p>
              <input
                type="password"
                value={keys[f.key]}
                onChange={(e) => setKeys({ ...keys, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          ))}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-2"
          >
            ダッシュボードを開く
          </button>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-4">
          APIキーはブラウザのlocalStorageにのみ保存されます
        </p>
      </div>
    </div>
  )
}