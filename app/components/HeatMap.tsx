import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { useEffect, useMemo, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster"
import "leaflet.heat"

import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"

type Item = {
  razao_social: string
  score: number
  lat: number
  lon: number
}

function Markers({ data }: { data: Item[] }) {
  const map = useMap()

  const myIcon = useMemo(
    () =>
      L.icon({
        iconUrl: "fire.png",
        iconSize: [50, 50],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
        shadowSize: [68, 95],
        shadowAnchor: [22, 94],
      }),
    []
  )

  useEffect(() => {
    if (!data.length) return

    const cluster = L.markerClusterGroup()

    map.addLayer(cluster)

    return () => {
      map.removeLayer(cluster)
    }
  }, [data, map, myIcon])

  return null
}

function Heatmap({ data }: { data: Item[] }) {
  const map = useMap()

  useEffect(() => {
    if (!data.length) return

    // peso baseado no score (ajuste se quiser)
    const heatPoints = data.map((p) => [p.lat, p.lon, Math.max(0, p.score)] as [number, number, number])

    const heat = (L as any).heatLayer(heatPoints, {
      radius: 25,
      blur: 20,
      maxZoom: 17,
    })

    heat.addTo(map)

    return () => {
      map.removeLayer(heat)
    }
  }, [data, map])

  return null
}

export default function Map() {
  const [points, setPoints] = useState<Item[]>([])

  useEffect(() => {
    fetch("https://webhooks.opusapp.com.br/webhook/geolidia/start")
      .then((r) => r.json())
      .then(setPoints)
  }, [])

  return (
    <MapContainer
      center={[-3.73, -38.52]}
      zoom={8}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* camada de calor (densidade) */}
      <Heatmap data={points} />

      {/* marcadores com cluster */}
      <Markers data={points} />
    </MapContainer>
  )
}
