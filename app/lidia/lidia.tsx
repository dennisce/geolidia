import { useEffect, useState } from "react"

export function Lidia() {
  const [Map, setMap] = useState<any>(null)

  useEffect(() => {
    import("../components/LidiaMap").then(m => setMap(() => m.default))
  }, [])

  if (!Map) return null

  return <Map />
}
