import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
const data = [
  { sector: 'AI', value: 4.1 },
  { sector: 'Semiconductor', value: 3.5 },
  { sector: 'Finance', value: 1.2 },
  { sector: 'Healthcare', value: -0.3 },
  { sector: 'Energy', value: -2.1 }
]
export default function SectorChart() {
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 h-[350px]">
      <h2 className="text-2xl font-bold mb-6">📊 Sector Performance</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="sector" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
