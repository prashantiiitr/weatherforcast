export default function Forecast({ list = [] }){
  // pick one entry near midday for each day
  const byDay = new Map()
  for(const item of list){
    const dt = new Date(item.dt * 1000)
    const key = dt.toISOString().slice(0,10)
    const prev = byDay.get(key)
    // prefer hours closest to 12:00 for that day
    const score = (d) => Math.abs(new Date(d.dt * 1000).getHours() - 12)
    if(!prev || score(item) < score(prev)) byDay.set(key, item)
  }
  const days = Array.from(byDay.values()).slice(0,5)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
      {days.map((d,i)=> {
        const when = new Date(d.dt * 1000)
        const date = when.toLocaleDateString(undefined, { month:'short', day:'numeric' })
        const weekday = when.toLocaleDateString(undefined, { weekday:'short' })
        const icon = d.weather?.[0]?.icon || '01d'
        const main = d.weather?.[0]?.main || ''
        const temp = Math.round(d.main?.temp ?? 0)
        const feels = Math.round(d.main?.feels_like ?? temp)

        return (
          <div key={i} className="tile">
            <div className="flex items-center justify-between">
              {/* top-left: day */}
              <div className="muted text-xs">{weekday}</div>
              {/* top-right: date */}
              <div className="muted text-xs">{date}</div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <img
                alt={main || 'weather icon'}
                width={36}
                height={36}
                src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
              />
              {/* temp in strong, theme-safe color */}
              <div className="temp text-lg font-semibold">{temp}°C</div>
            </div>

            {/* description + feels like in muted color */}
            <div className="muted text-sm mt-1">{main}</div>
            <div className="muted text-xs">Feels {feels}°</div>
          </div>
        )
      })}
    </div>
  )
}
