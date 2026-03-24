import { useEffect, useMemo, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"
import type { IndicatorLayerConfig } from "./LayersControl"
import type { FeatureTipo, IndicatorPayload } from "./tiles.helpers"
import type { ColorScaleKey } from "./tiles.helpers"

type HeatPoint = [number, number, number]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function normalizeValue(value: number, minValue: number, maxValue: number) {
  if (!Number.isFinite(value)) return 0
  if (maxValue <= minValue) return value > minValue ? 1 : 0

  const normalized = (value - minValue) / (maxValue - minValue)
  return clamp(normalized, 0, 1)
}

function getHeatGradient(colorScale: ColorScaleKey): Record<number, string> {
  switch (colorScale) {
    case "blues":
      return {
        0.15: "#dbeafe",
        0.35: "#93c5fd",
        0.55: "#60a5fa",
        0.75: "#2563eb",
        1.0: "#1d4ed8",
      }

    case "greens":
      return {
        0.15: "#dcfce7",
        0.35: "#86efac",
        0.55: "#4ade80",
        0.75: "#16a34a",
        1.0: "#166534",
      }

    case "purples":
      return {
        0.15: "#f3e8ff",
        0.35: "#d8b4fe",
        0.55: "#c084fc",
        0.75: "#9333ea",
        1.0: "#6b21a8",
      }

    case "oranges":
      return {
        0.15: "#ffedd5",
        0.35: "#fdba74",
        0.55: "#fb923c",
        0.75: "#ea580c",
        1.0: "#9a3412",
      }

    case "teal":
      return {
        0.15: "#ccfbf1",
        0.35: "#99f6e4",
        0.55: "#5eead4",
        0.75: "#0d9488",
        1.0: "#115e59",
      }

    case "reds":
    default:
      return {
        0.15: "#fee2e2",
        0.35: "#fecaca",
        0.55: "#fca5a5",
        0.75: "#ef4444",
        1.0: "#b91c1c",
      }
  }
}

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

  const minValue = indicator.minValue ?? 0
  const maxValue = indicator.maxValue ?? 1

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
        const rawValue = Number(row[indicator.key] ?? 0)

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
        if (!Number.isFinite(rawValue) || rawValue <= 0) return null

        const normalized = normalizeValue(rawValue, minValue, maxValue)
        const intensity = Math.pow(normalized, 1.5)

        if (intensity <= 0) return null

        return [lat, lon, intensity] as HeatPoint
      })
      .filter(Boolean) as HeatPoint[]
  }, [
    indicatorsData,
    indicator.key,
    featureTipo,
    minValue,
    maxValue,
  ])

  // Para pegar a cor do gradiente de acordo com a seleção do usuário
  // const gradient = useMemo(() => {
  //   return getHeatGradient(indicator.colorScale)
  // }, [indicator.colorScale])
  
  // Gradiente padrão
  const gradient = {
  0.15: "#0000ff",
  0.35: "#00ffff",
  0.55: "#00ff00",
  0.75: "#ffff00",
  1.0: "#ff0000",
}



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
    pane.style.opacity = "1"

    const heatLayer = (L as any).heatLayer(points, {
      pane: paneName,
      radius: 18,
      blur: 14,
      maxZoom: 17,
      minOpacity: 0.5,
      max: 1,
      gradient,
    })

    heatLayer.addTo(map)
    layerRef.current = heatLayer

    requestAnimationFrame(() => {
      const canvas = pane?.querySelector("canvas") as HTMLCanvasElement | null
      if (canvas) {
        canvas.style.opacity = "0.1"
      }
    })

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, points, gradient, indicator.key])

  return null
}