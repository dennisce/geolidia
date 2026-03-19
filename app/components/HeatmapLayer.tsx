import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"
import type { IndicatorLayerConfig } from "./LayersControl"

export function HeatmapLayer({
  indicator,
}: {
  indicator: IndicatorLayerConfig
}) {
  const map = useMap()
  const layerRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    const paneName = `heatmap-pane-${indicator.key}`

    async function load() {
      try {
        if (layerRef.current && map.hasLayer(layerRef.current)) {
          map.removeLayer(layerRef.current)
          layerRef.current = null
        }

        let pane = map.getPane(paneName)

        if (!pane) {
          pane = map.createPane(paneName)
        }

        pane.style.zIndex = "450"
        pane.style.pointerEvents = "none"
        pane.style.opacity = "0.08"

        const url = `https://tiles.opusapp.com.br/indicators?indicators=${indicator.key}&uf=${indicator.uf}`
        const res = await fetch(url)
        const json = await res.json()

        if (cancelled) return

        const points = Object.values(json)
          .map((row: any) => {
            const lat = Number(row.lat)
            const lon = Number(row.lon)
            const value = Number(row[indicator.key] ?? 0)

            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
            return [lat, lon, value] as [number, number, number]
          })
          .filter(Boolean) as [number, number, number][]

        if (!points.length) return

        const heatLayer = (L as any).heatLayer(points, {
          pane: paneName,
          radius: 25,
          blur: 20,
          maxZoom: 17,
          minOpacity: 0.05,
        })

        heatLayer.addTo(map)
        layerRef.current = heatLayer

        requestAnimationFrame(() => {
          const canvas = pane?.querySelector("canvas") as HTMLCanvasElement | null
          if (canvas) {
            canvas.style.opacity = "0.10"
          }
        })
      } catch (error) {
        console.error("Erro ao carregar heatmap:", error)
      }
    }

    load()

    return () => {
      cancelled = true

      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [indicator, map])

  return null
}