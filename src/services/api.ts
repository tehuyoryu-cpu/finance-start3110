// ストレージからAPIキーを取得
export function getKeys() {
  return {
    finnhub: localStorage.getItem('api_finnhub') || '',
    gnews: localStorage.getItem('api_gnews') || '',
    claude: localStorage.getItem('api_claude') || '',
  }
}

export function saveKeys(keys: { finnhub: string; gnews: string; claude: string }) {
  localStorage.setItem('api_finnhub', keys.finnhub)
  localStorage.setItem('api_gnews', keys.gnews)
  localStorage.setItem('api_claude', keys.claude)
}

export function hasAllKeys() {
  const k = getKeys()
  return k.finnhub && k.gnews && k.claude
}

// Finnhub 株価 (無料: 60req/min)
export async function fetchQuote(symbol: string) {
  const { finnhub } = getKeys()
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhub}`
  )
  if (!res.ok) throw new Error('Finnhub error')
  return res.json()
}

// GNews ニュース (無料: 100req/日)
export async function fetchNews(query = 'stock market') {
  const { gnews } = getKeys()
  const res = await fetch(
    `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=9&token=${gnews}`
  )
  if (!res.ok) throw new Error('GNews error')
  const data = await res.json()
  return data.articles || []
}

// Claude AI 要約 (Haiku: 低コスト、無料枠あり)
export async function summarizeWithClaude(text: string): Promise<string> {
  const { claude } = getKeys()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claude,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Summarize these market news headlines in 3 short bullet points (each under 20 words):\n\n${text}`
        }
      ]
    })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Claude error')
  }
  const data = await res.json()
  return data.content[0]?.text || ''
}