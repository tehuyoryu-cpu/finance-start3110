const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY
export async function getMarketNews() {
  const res = await fetch(`https://newsapi.org/v2/top-headlines?category=business&apiKey=${NEWS_API_KEY}`)
  return res.json()
}
