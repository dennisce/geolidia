import { useEffect, useMemo, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"

import Supercluster from "supercluster"
import type { PointFeature } from "supercluster"

import type { IndicatorLayerConfig } from "./LayersControl"
import type { FeatureTipo, IndicatorPayload } from "./tiles.helpers"
import { getColorScaleColors } from "./tiles.helpers"

type PointRow = {
  id: string
  lat: number
  lon: number
  rawValue: number
}

type ClusterProps = {
  id?: string
  rawValue: number
  count: number
}

type ClusterFeature = PointFeature<ClusterProps>
type BBox = [number, number, number, number]

const CLUSTER_RADIUS = 100
const CLUSTER_MAX_ZOOM = 15

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function normalizeValue(value: number, minValue: number, maxValue: number) {
  if (!Number.isFinite(value)) return 0
  if (maxValue <= minValue) return 0

  return clamp((value - minValue) / (maxValue - minValue), 0, 1)
}

function getColorForNormalizedValue(
  normalized: number,
  scale: IndicatorLayerConfig["colorScale"]
) {
  const colors = getColorScaleColors(scale)

  if (normalized <= 0.2) return colors[0]
  if (normalized <= 0.4) return colors[1]
  if (normalized <= 0.6) return colors[2]
  if (normalized <= 0.8) return colors[3]
  return colors[4]
}

function getRadius(normalized: number) {
  const clamped = clamp(normalized, 0, 1)

  const minRadius = 6
  const maxRadius = 28

  const scaled = Math.sqrt(clamped)

  return minRadius + scaled * (maxRadius - minRadius)
}

function shouldIncludeFeature(featureId: string, featureTipo: FeatureTipo) {
  if (featureTipo === "bairro,setor") return true
  if (featureTipo === "bairro") return featureId.startsWith("bairro_")
  if (featureTipo === "setor") return featureId.startsWith("setor_")
  return true
}

function getMapBoundsBBox(map: L.Map): BBox {
  const bounds = map.getBounds()
  return [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ]
}

function getSafeZoom(map: L.Map) {
  const zoom = map.getZoom()
  return Number.isFinite(zoom) ? Math.round(zoom) : 0
}

function formatValue(value: number) {
  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })
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

        return {
          id: featureId,
          lat,
          lon,
          rawValue,
        }
      })
      .filter((item): item is PointRow => item !== null)
  }, [indicatorsData, featureTipo, indicator.key])

  const clusterIndex = useMemo(() => {
    const index = new Supercluster<ClusterProps, ClusterProps>({
      radius: CLUSTER_RADIUS,
      maxZoom: CLUSTER_MAX_ZOOM,
      minPoints: 1,

      map: (props) => ({
        rawValue: props.rawValue,
        count: 1,
      }),

      reduce: (accumulated, props) => {
        accumulated.rawValue += props.rawValue
        accumulated.count += props.count
      },
    })

    const features: ClusterFeature[] = points.map((point) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.lon, point.lat],
      },
      properties: {
        id: point.id,
        rawValue: point.rawValue,
        count: 1,
      },
    }))

    index.load(features)
    return index
  }, [points])

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

    const render = () => {
      group.clearLayers()

      const bbox = getMapBoundsBBox(map)
      const zoom = getSafeZoom(map)
      const features = clusterIndex.getClusters(bbox, zoom)

      features.forEach((feature) => {
        const [lon, lat] = feature.geometry.coordinates
        const props = feature.properties

        if (!props) return

        const clusterMeta = feature.properties as ClusterProps & {
          cluster?: boolean
          point_count?: number
        }

        const isCluster = Boolean(clusterMeta.cluster)
        const count = isCluster
          ? Number(clusterMeta.point_count ?? props.count ?? 1)
          : Number(props.count ?? 1)

        const rawValue = Number(props.rawValue ?? 0)
        const normalized = normalizeValue(rawValue, minValue, maxValue)

        const fillColor = getColorForNormalizedValue(
          normalized,
          indicator.colorScale
        )
        const radius = getRadius(normalized)

        const circle = L.circleMarker([lat, lon], {
          pane: paneName,
          radius,
          stroke: true,
          weight: isCluster ? 2 : 1,
          color: "#ffffff",
          opacity: 0.9,
          fill: true,
          fillColor,
          fillOpacity: isCluster ? 0.85 : 0.75,
        })

        const tooltip = isCluster
          ? `
            <div style="min-width: 180px;">
              <div><strong>${indicator.label}</strong></div>
              <div>Agrupados: ${count.toLocaleString("pt-BR")}</div>
              <div>Valor acumulado: ${formatValue(rawValue)}</div>
            </div>
          `
          : `
            <div style="min-width: 140px;">
              <div><strong>${indicator.label}</strong></div>
              <div>Valor: ${formatValue(rawValue)}</div>
            </div>
          `

        circle.bindTooltip(tooltip, {
          direction: "top",
          sticky: true,
          opacity: 0.95,
        })

        group.addLayer(circle)
      })
    }

    render()
    group.addTo(map)
    layerRef.current = group

    map.on("zoomend moveend", render)

    return () => {
      map.off("zoomend moveend", render)

      if (layerRef.current) {
        layerRef.current.remove()
        layerRef.current = null
      }
    }
  }, [
    map,
    points,
    clusterIndex,
    indicator.key,
    indicator.label,
    indicator.colorScale,
    minValue,
    maxValue,
  ])

  return null
}