// Chrome拡張 & 通常ブラウザ両対応のストレージ
function isChromeExt(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage
}

export async function loadKeys(): Promise<{ finnhub: string; gnews: string; claude: string }> {
  if (isChromeExt()) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['api_finnhub', 'api_gnews', 'api_claude'], (result) => {
        resolve({
          finnhub: result.api_finnhub || '',
          gnews: result.api_gnews || '',
          claude: result.api_claude || '',
        })
      })
    })
  }
  return {
    finnhub: localStorage.getItem('api_finnhub') || '',
    gnews: localStorage.getItem('api_gnews') || '',
    claude: localStorage.getItem('api_claude') || '',
  }
}

export async function saveKeys(keys: { finnhub: string; gnews: string; claude: string }) {
  if (isChromeExt()) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set({
        api_finnhub: keys.finnhub,
        api_gnews: keys.gnews,
        api_claude: keys.claude,
      }, resolve)
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
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhub}`
  )
  if (!res.ok) throw new Error('Finnhub error')
  return res.json()
}

// GNews ニュース (無料: 100req/日)
export async function fetchNews(query = 'stock market') {
  const { gnews } = await loadKeys()
  const res = await fetch(
    `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=6&token=${gnews}`
  )
  if (!res.ok) throw new Error('GNews error')
  const data = await res.json()
  return data.articles || []
}

// Claude AI 要約 (Haiku: 低コスト)
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
      messages: [
        {
          role: 'user',
          content: `Summarize these market news headlines in 3 short bullet points (each under 20 words):\n\n${text}`,
        },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Claude error')
  }
  const data = await res.json()
  return data.content[0]?.text || ''
}