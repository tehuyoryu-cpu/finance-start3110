/* eslint-disable @typescript-eslint/no-explicit-any */

function getChromeStorage(): chrome.storage.LocalStorageArea | null {
  try {
    const c = (window as any).chrome
    if (c && c.storage && c.storage.local) return c.storage.local
  } catch {}
  return null
}

export async function loadKeys(): Promise<{ finnhub: string; gnews: string; claude: string }> {
  const storage = getChromeStorage()
  if (storage) {
    return new Promise((resolve) => {
      storage.get(['api_finnhub', 'api_gnews', 'api_claude'], (r: any) => {
        resolve({ finnhub: r.api_finnhub || '', gnews: r.api_gnews || '', claude: r.api_claude || '' })
      })
    })
  }
  return {
    finnhub: localStorage.getItem('api_finnhub') || '',
    gnews: localStorage.getItem('api_gnews') || '',
    claude: localStorage.getItem('api_claude') || '',
  }
}

export async function saveKeys(keys: { finnhub: string; gnews: string; claude: string }): Promise<void> {
  const storage = getChromeStorage()
  if (storage) {
    return new Promise((resolve) => {
      storage.set({ api_finnhub: keys.finnhub, api_gnews: keys.gnews, api_claude: keys.claude }, resolve)
    })
  }
  localStorage.setItem('api_finnhub', keys.finnhub)
  localStorage.setItem('api_gnews', keys.gnews)
  localStorage.setItem('api_claude', keys.claude)
}

export async function hasAllKeys(): Promise<boolean> {
  const k = await loadKeys()
  return !!(k.finnhub && k.gnews && k.claude)
}

// Finnhub 株価 (無料: 60req/min)
export async function fetchQuote(symbol: string) {
  const { finnhub } = await loadKeys()
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhub}`)
  if (!res.ok) throw new Error('Finnhub API error')
  return res.json()
}

// GNews ニュース (無料: 100req/日)
export async function fetchNews(query = 'stock market') {
  const { gnews } = await loadKeys()
  const res = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=6&token=${gnews}`)
  if (!res.ok) throw new Error('GNews API error')
  const data = await res.json()
  return data.articles || []
}

// Claude Haiku AI要約
export async function summarizeWithClaude(text: string): Promise<string> {
  const { claude } = await loadKeys()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claude,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: `Summarize in 3 bullet points (under 20 words each):\n\n${text}` }],
    }),
  })
  if (!res.ok) {
    const e = await res.json()
    throw new Error(e.error?.message || 'Claude API error')
  }
  const data = await res.json()
  return data.content[0]?.text || ''
}