export default function EconomicCalendar() {
  const events = [
    { event: 'US CPI', time: 'Tomorrow' },
    { event: 'FOMC', time: '3 days' },
    { event: 'BOJ Meeting', time: 'Next week' }
  ]
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-xl font-bold mb-4">📅 Economic Calendar</h2>
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.event} className="flex justify-between">
            <div>{event.event}</div>
            <div className="text-zinc-400">{event.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
