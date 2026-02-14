import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { useEffect, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster"

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
  var myIcon = L.icon({
        iconUrl: 'fire.png',
        iconSize: [50, 50],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
        shadowSize: [68, 95],
        shadowAnchor: [22, 94]
    });
  useEffect(() => {
    if (!data.length) return

    const cluster = L.markerClusterGroup()

    data.forEach((p) => {
        let marker;
        if(p.score > 22) {
            marker = L.marker([p.lat, p.lon], { icon: myIcon })
        } else {
            marker = L.marker([p.lat, p.lon])
        }
      marker.bindPopup(p.razao_social + " - Score: " + p.score )
      cluster.addLayer(marker)
    })

    map.addLayer(cluster)

    return () => {
      map.removeLayer(cluster)
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
      <Markers data={points} />
    </MapContainer>
  )
}
