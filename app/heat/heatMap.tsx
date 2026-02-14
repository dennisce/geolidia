import { useEffect, useState } from "react"

export function HeatMap() {
  const [Map, setMap] = useState<any>(null)

  useEffect(() => {
    import("../components/HeatMap").then(m => setMap(() => m.default))
  }, [])

  if (!Map) return null

  return <Map />
}
