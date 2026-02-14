import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { useEffect, useMemo, useState } from "react"
import { getAssistantLoadingMessage } from "./assistantLoadingMessage";
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster"
import "leaflet.heat"

import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "@geoman-io/leaflet-geoman-free"
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css"

type JsonItems = Array<{
  json: {
    razao_social: string
    score: number
    lat: number
    lon: number
  }
}>

type Item = {
  map_type: string
  points: JsonItems
  message: string
}

function Markers({ data }: { data: Item[] }) {
  const map = useMap()

  const fireIcon = useMemo(
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
    // geoman pode não existir no tipo do TS (evita erro e evita re-add em todo render)
    // @ts-ignore
    if (map?.pm?.addControls) {
      // @ts-ignore
      map.pm.addControls({
        position: "topleft",
        drawMarker: true,
        drawPolygon: true,
        drawRectangle: true,
        drawCircle: true,
        editMode: true,
        dragMode: true,
        removalMode: true,
      })
    }
  }, [map])

  function showMap(item: JsonItems) {
    const cluster = L.markerClusterGroup()

    item.forEach((p) => {
      const point = p.json
      const marker =
        point.score > 10
          ? L.marker([point.lat, point.lon], { icon: fireIcon })
          : L.marker([point.lat, point.lon])

      marker.bindPopup(point.razao_social + " - Score: " + point.score)
      cluster.addLayer(marker)
    })

    map.addLayer(cluster)

    return () => {
      map.removeLayer(cluster)
    }
  }

  function showHeatMap(item: JsonItems) {
    const heatPoints = item.map((p) => {
      const point = p.json
      return [point.lat, point.lon, Math.max(0, point.score)] as [
        number,
        number,
        number
      ]
    })

    const heat = (L as any).heatLayer(heatPoints, {
      radius: 25,
      blur: 20,
      maxZoom: 17,
      // NOTE: leaflet.heat não usa "opacity" aqui
      minOpacity: 0.3,
      max: 25,
    })

    heat.addTo(map)

    return () => {
      map.removeLayer(heat)
    }
  }

  useEffect(() => {
    if (!data.length) return

    let cleanup: undefined | (() => void)

    switch (data[0].map_type) {
      case "heatmap":
        cleanup = showHeatMap(data[0].points)
        break
      default:
        cleanup = showMap(data[0].points)
        break
    }

    return () => {
      cleanup?.()
    }
  }, [data, map, fireIcon])

  return null
}

export default function Map() {
  const [points, setPoints] = useState<Item[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [assistantReply, setAssistantReply] = useState<string>("")
  const [showToast, setShowToast] = useState(false)

  const onSend = async () => {
    const q = search.trim()
    if (!q) return

    try {
      setLoading(true)
      setShowToast(false)
      setShowToast(true)
      setAssistantReply(getAssistantLoadingMessage())
      
      const res = await fetch("https://webhooks.opusapp.com.br/webhook/geolidia/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q }),
      })
      
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`POST /question falhou (${res.status}). ${txt}`)
      }

      const data = await res.json().catch(() => null)
      if(!data[0].points){
        setShowToast(false)
        setAssistantReply(data[0].message)
        setShowToast(true)
        return
      }
      setShowToast(false)
      setAssistantReply(data[0].message)
      setShowToast(true)
      setPoints(data)
      setSearch("")

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch("https://webhooks.opusapp.com.br/webhook/geolidia/start")
      .then((r) => r.json())
      .then(setPoints)
  }, [])

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={[-3.73, -38.52]}
        zoom={8}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Markers data={points} />
      </MapContainer>
      <div className="absolute top-6 right-6 z-[2000] max-w-sm w-[92vw] sm:w-[420px] px-0">
        <div
          className={`
            relative flex items-start gap-3
            bg-black/40 backdrop-blur-xl
            border border-white/10
            rounded-2xl
            px-5 py-4
            shadow-[0_0_40px_rgba(124,58,237,0.15)]
            transition-all duration-300
            ${showToast ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0 pointer-events-none"}
          `}
        >
          <div className="mt-0.5 text-violet-400">🤖</div>

          <div className="flex-1">
            <div className="text-xs text-white/60 mb-1">Assistente</div>
            <div className="text-sm text-white whitespace-pre-wrap">
              {assistantReply}
            </div>
          </div>

          <button
            onClick={() => setShowToast(false)}
            className="text-white/50 hover:text-white/80 transition"
            aria-label="Fechar"
            type="button"
          >
            ✕
          </button>

          {/* Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 blur-xl opacity-40 pointer-events-none" />
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-[1000]">
        <div
          className="
            relative flex items-center gap-3
            bg-white/5 backdrop-blur-xl
            border border-white/10
            rounded-2xl
            px-5 py-4
            shadow-[0_0_40px_rgba(124,58,237,0.15)]
            focus-within:border-violet-500/60
            transition-all duration-300
          "
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 blur-xl opacity-40 pointer-events-none" />

          <div className="text-violet-800">🤖</div>

          <textarea
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pergunte qualquer coisa ao assistente..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()   // impede quebra de linha
                onSend()             // chama envio
              }
            }}
            rows={1}
            className="
              w-full resize-none bg-transparent
              text-violet-950 placeholder-violet/40
              focus:outline-none
              text-sm md:text-base
            "
          />
          <button
            onClick={onSend}
            disabled={loading}
            className="
              bg-gradient-to-r from-violet-600 to-cyan-500
              hover:opacity-90
              text-white
              px-4 py-2
              rounded-xl
              text-sm font-medium
              transition-all duration-200
              disabled:opacity-40
              disabled:cursor-not-allowed
              shadow-lg
            "
          >
            {loading ? "..." : "Enviar"}
          </button>
        </div>
      </div>
      
    </div>
  )
}
