import { useState } from 'react'
import { savePrefs, type Prefs } from '../services/api'

const ENGINES = [
  { value: 'google',     label: 'Google' },
  { value: 'bing',       label: 'Bing' },
  { value: 'duckduckgo', label: 'DuckDuckGo' },
  { value: 'brave',      label: 'Brave Search' },
  { value: 'yahoo_jp',   label: 'Yahoo! Japan' },
  { value: 'startpage',  label: 'Startpage' },
  { value: 'ecosia',     label: 'Ecosia' },
]

interface Props {
  prefs: Prefs
  onUpdate: (p: Prefs) => void
  onClose: () => void
}

export default function SettingsPanel({ prefs, onUpdate, onClose }: Props) {
  const [local, setLocal] = useState({ ...prefs })

  const save = async () => {
    await savePrefs(local)
    onUpdate(local)
    onClose()
  }

  const row = (label: string, key: keyof Prefs, options: { value: string; label: string }[]) => (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-36 flex-shrink-0">{label}</span>
      <select value={String(local[key])}
        onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:border-blue-500 outline-none transition-colors">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="animate-pop-in bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-zinc-950 border-b border-zinc-800">
          <span className="font-bold text-sm">⚙ 設定</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">検索エンジン</p>
            <div className="space-y-2">
              {row('ニュース内検索', 'searchEngine', ENGINES)}
              {row('記事タイトル検索', 'searchEngineNews', ENGINES)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">リーダービュー</p>
            <div className="space-y-2">
              {row('デフォルトテーマ', 'readerTheme', [
                { value: 'dark', label: '🌙 ダーク' },
                { value: 'light', label: '☀️ ライト' },
                { value: 'sepia', label: '📜 セピア' },
              ])}
              {row('文字サイズ', 'readerFontSize', [
                { value: '13', label: '小 (13px)' },
                { value: '15', label: '中 (15px)' },
                { value: '17', label: '大 (17px)' },
                { value: '19', label: '特大 (19px)' },
              ])}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end px-5 py-3 border-t border-zinc-800">
          <button onClick={onClose}
            className="text-xs px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
            キャンセル
          </button>
          <button onClick={save}
            className="text-xs px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all hover:scale-105 active:scale-95">
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
