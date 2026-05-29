const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY
export async function getQuote(symbol: string) {
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`)
  return res.json()
}
