import { useEffect, useMemo, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"
import type { IndicatorLayerConfig } from "./LayersControl"
import type { FeatureTipo, IndicatorPayload } from "./tiles.helpers"

export function HeatmapLayer({
  indicator,
  indicatorsData,
  featureTipo,
}: {
  indicator: IndicatorLayerConfig
  indicatorsData: IndicatorPayload
  featureTipo: FeatureTipo
}) {
  const map = useMap()
  const layerRef = useRef<any>(null)

  const points = useMemo(() => {
    const rows = Object.entries(indicatorsData).filter(([featureId]) => {
      if (featureTipo === "bairro,setor") return true
      if (featureTipo === "bairro") return featureId.startsWith("bairro_")
      if (featureTipo === "setor") return featureId.startsWith("setor_")
      return true
    })

    return rows
      .map(([, row]) => {
        const lat = Number(row.lat)
        const lon = Number(row.lon)
        const value = Number(row[indicator.key] ?? 0)

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
        if (!Number.isFinite(value) || value <= 0) return null

        return [lat, lon, value] as [number, number, number]
      })
      .filter(Boolean) as [number, number, number][]
  }, [indicatorsData, indicator.key, featureTipo])

  useEffect(() => {
    const paneName = `heatmap-pane-${indicator.key}`

    if (layerRef.current && map.hasLayer(layerRef.current)) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }

    if (!points.length) return

    let pane = map.getPane(paneName)

    if (!pane) {
      pane = map.createPane(paneName)
    }

    pane.style.zIndex = "450"
    pane.style.pointerEvents = "none"
    pane.style.opacity = "0.08"

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

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, points, indicator.key])

  return null
}