import { useEffect, useMemo, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import type { IndicatorLayerConfig } from "./LayersControl"
import type { ColorScaleKey, FeatureTipo, IndicatorPayload } from "./tiles.helpers"
import { getColorScaleColors } from "./tiles.helpers"

type PointRow = {
  id: string
  lat: number
  lon: number
  rawValue: number
  normalized: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function normalizeValue(value: number, minValue: number, maxValue: number) {
  if (!Number.isFinite(value)) return 0
  if (maxValue <= minValue) return 0

  return clamp((value - minValue) / (maxValue - minValue), 0, 1)
}

function getColorScale(scale: ColorScaleKey): string[] {
    return getColorScaleColors(scale) || getColorScaleColors("reds")
}

function getColorForNormalizedValue(normalized: number, scale: ColorScaleKey) {
  const colors = getColorScale(scale)

  if (normalized <= 0.2) return colors[0]
  if (normalized <= 0.4) return colors[1]
  if (normalized <= 0.6) return colors[2]
  if (normalized <= 0.8) return colors[3]
  return colors[4]
}

function getRadius(normalized: number) {
  const minRadius = 6
  const maxRadius = 20

  return minRadius + normalized * (maxRadius - minRadius)
}

function shouldIncludeFeature(featureId: string, featureTipo: FeatureTipo) {
  if (featureTipo === "bairro,setor") return true
  if (featureTipo === "bairro") return featureId.startsWith("bairro_")
  if (featureTipo === "setor") return featureId.startsWith("setor_")
  return true
}

export function CentroidLayer({
  indicator,
  indicatorsData,
  featureTipo,
}: {
  indicator: IndicatorLayerConfig
  indicatorsData: IndicatorPayload
  featureTipo: FeatureTipo
}) {
  const map = useMap()
  const layerRef = useRef<L.LayerGroup | null>(null)

  const minValue = indicator.minValue ?? 0
  const maxValue = indicator.maxValue ?? 1

  const points = useMemo<PointRow[]>(() => {
    return Object.entries(indicatorsData)
      .filter(([featureId]) => shouldIncludeFeature(featureId, featureTipo))
      .map(([featureId, row]) => {
        const lat = Number(row.lat)
        const lon = Number(row.lon)
        const rawValue = Number(row[indicator.key] ?? 0)

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
        if (!Number.isFinite(rawValue) || rawValue <= 0) return null

        const normalized = normalizeValue(rawValue, minValue, maxValue)

        return {
          id: featureId,
          lat,
          lon,
          rawValue,
          normalized,
        }
      })
      .filter((item): item is PointRow => item !== null)
  }, [indicatorsData, featureTipo, indicator.key, minValue, maxValue])

  useEffect(() => {
    const paneName = `centroid-pane-${indicator.key}`

    if (layerRef.current) {
      layerRef.current.remove()
      layerRef.current = null
    }

    if (!points.length) return

    let pane = map.getPane(paneName)
    if (!pane) {
      pane = map.createPane(paneName)
    }

    pane.style.zIndex = "460"
    pane.style.pointerEvents = "none"

    const group = L.layerGroup([], { pane: paneName })

    points.forEach((point) => {
      const fillColor = getColorForNormalizedValue(point.normalized, indicator.colorScale)
      const radius = getRadius(point.normalized)

      const circle = L.circleMarker([point.lat, point.lon], {
        pane: paneName,
        radius,
        stroke: true,
        weight: 1,
        color: "#ffffff",
        opacity: 0.8,
        fill: true,
        fillColor,
        fillOpacity: 0.75,
      })

      circle.bindTooltip(
        `
          <div style="min-width: 140px;">
            <div><strong>${indicator.label}</strong></div>
            <div>Valor: ${point.rawValue.toLocaleString("pt-BR")}</div>
          </div>
        `,
        {
          direction: "top",
          sticky: true,
          opacity: 0.95,
        }
      )

      group.addLayer(circle)
    })

    group.addTo(map)
    layerRef.current = group

    return () => {
      if (layerRef.current) {
        layerRef.current.remove()
        layerRef.current = null
      }
    }
  }, [map, points, indicator.key, indicator.label, indicator.colorScale])

  return null
}