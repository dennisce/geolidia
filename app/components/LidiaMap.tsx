import { useCallback, useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"

import L from "leaflet"

import "leaflet/dist/leaflet.css"
import "leaflet.markercluster"
import "leaflet.heat"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"

import { getAssistantLoadingMessage } from "./assistantLoadingMessage"

import {
  LayersControl,
  type IndicatorKey,
  type IndicatorLayerConfig,
  type VisualizationType,
} from "./LayersControl"

import {
  buildIndicatorsUrl,
  type ColorScaleKey,
  type IndicatorPayload,
  type FeatureTipo,
  type UfCode,
} from "./tiles.helpers"

import { MapIndicatorLayers } from "./MapIndicatorLayers"

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
  points?: JsonItems
  message: string
}

const MAP_CENTER: [number, number] = [-3.73, -38.52]
const MAP_ZOOM = 7
const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const START_URL = "https://webhooks.opusapp.com.br/webhook/geolidia/start"
const QUESTION_URL = "https://webhooks.opusapp.com.br/webhook/geolidia/question"
const INDICATORS_BASE_URL = "https://tiles.opusapp.com.br"

const INDICATOR_SCALE: Record<IndicatorKey, { min: number; max: number }> = {
  total_domicilios: { min: 0, max: 25000 },
  renda_media: { min: 0, max: 1000 },
}

function getIndicatorMaxFromPayload(
  payload: IndicatorPayload,
  key: IndicatorKey
): number {
  const values = Object.values(payload)
    .map((row) => Number(row[key]))
    .filter((value) => Number.isFinite(value) && value >= 0)

  if (!values.length) {
    return INDICATOR_SCALE[key].max
  }

  const max = Math.max(...values)

  return max > 0 ? max : INDICATOR_SCALE[key].max
}

function AssistantToast({
  show,
  message,
  onClose,
}: {
  show: boolean
  message: string
  onClose: () => void
}) {
  return (
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
          ${show ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0 pointer-events-none"}
        `}
      >
        <div className="mt-0.5 text-violet-400">Assistente</div>

        <div className="flex-1">
          <div className="text-xs text-white/60 mb-1">Mensagem</div>
          <div className="text-sm text-white whitespace-pre-wrap">{message}</div>
        </div>

        <button
          onClick={onClose}
          className="text-white/50 hover:text-white/80 transition"
          aria-label="Fechar"
          type="button"
        >
          ✕
        </button>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 blur-xl opacity-40 pointer-events-none" />
      </div>
    </div>
  )
}

function SearchBar({
  value,
  loading,
  onChange,
  onSend,
}: {
  value: string
  loading: boolean
  onChange: (value: string) => void
  onSend: () => void
}) {
  return (
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

        <div className="text-violet-800">IA</div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pergunte qualquer coisa ao assistente..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              onSend()
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
  )
}

function MarkersLayer({ data }: { data: Item[] }) {
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

  const firstItem = data[0]
  const points = firstItem?.points ?? []
  const mapType = firstItem?.map_type

  useEffect(() => {
    if (!points.length) return

    let cleanup: (() => void) | undefined

    if (mapType === "heatmap") {
      const heatPoints = points.map(
        ({ json }) => [json.lat, json.lon, 100] as [number, number, number]
      )

      const heat = (L as any).heatLayer(heatPoints, {
        radius: 25,
        blur: 20,
        maxZoom: 17,
        minOpacity: 0.3,
        max: 25,
      })

      heat.addTo(map)
      cleanup = () => map.removeLayer(heat)
    } else {
      const cluster = L.markerClusterGroup()

      points.forEach(({ json }) => {
        const marker =
          json.score > 10
            ? L.marker([json.lat, json.lon], { icon: fireIcon })
            : L.marker([json.lat, json.lon])

        marker.bindPopup(`${json.razao_social} - Score: ${json.score}`)
        cluster.addLayer(marker)
      })

      cluster.addTo(map)
      cleanup = () => map.removeLayer(cluster)
    }

    return () => cleanup?.()
  }, [map, points, mapType, fireIcon])

  return null
}

export default function LidiaMap() {
  const [points, setPoints] = useState<Item[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [assistantReply, setAssistantReply] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [indicatorsData, setIndicatorsData] = useState<IndicatorPayload>({})
  const [layersControlCollapsed, setLayersControlCollapsed] = useState(false)
  const [featureTipo, setFeatureTipo] = useState<FeatureTipo>("bairro,setor")
  const [uf, setUf] = useState<UfCode>(23)

  const [indicatorLayers, setIndicatorLayers] = useState<IndicatorLayerConfig[]>([
    {
      key: "total_domicilios",
      label: "Total de domicílios",
      desc: "Total de domicílios por bairro ou setor censitário.",
      uf,
      visible: false,
      visualization: "choropleth",
      supportedVisualizations: ["choropleth", "heatmap", "centroid"],
      colorScale: "reds",
      minZoom: 7,
      minValue: INDICATOR_SCALE.total_domicilios.min,
      maxValue: INDICATOR_SCALE.total_domicilios.max,
    },
    {
      key: "renda_media",
      label: "Renda média",
      desc: "Renda média por bairro ou setor censitário.",
      uf,
      visible: false,
      visualization: "choropleth",
      supportedVisualizations: ["choropleth", "heatmap", "centroid"],
      colorScale: "blues",
      minZoom: 7,
      minValue: INDICATOR_SCALE.renda_media.min,
      maxValue: INDICATOR_SCALE.renda_media.max,
    },
  ])

  const handleChangeMaxValue = (
    key: IndicatorKey,
    next: number | undefined
  ) => {
    setIndicatorLayers((prev) =>
      prev.map((layer) =>
        layer.key === key
          ? {
              ...layer,
              minValue: 0,
              maxValue: next,
            }
          : layer
      )
    )
  }

  const visibleIndicatorLayers = useMemo(
    () => indicatorLayers.filter((layer) => layer.visible),
    [indicatorLayers]
  )

  const activeIndicatorKeys = useMemo(() => {
    return Array.from(new Set(visibleIndicatorLayers.map((layer) => layer.key)))
  }, [visibleIndicatorLayers])

  // const sharedUf = useMemo(() => {
  //   return visibleIndicatorLayers[0]?.uf
  // }, [visibleIndicatorLayers])

  const indicatorsUrl = useMemo(() => {
  if (!activeIndicatorKeys.length) return null

  return buildIndicatorsUrl({
    baseUrl: INDICATORS_BASE_URL,
    indicators: activeIndicatorKeys,
    uf,
  })
}, [activeIndicatorKeys, uf])

  const showAssistantToast = useCallback((message: string) => {
    setShowToast(false)
    setAssistantReply(message)
    setShowToast(true)
  }, [])

  const hideAssistantToast = useCallback(() => {
    setShowToast(false)
  }, [])

  const onSend = useCallback(async () => {
    const q = search.trim()
    if (!q || loading) return

    try {
      setLoading(true)
      showAssistantToast(getAssistantLoadingMessage())

      const response = await fetch(QUESTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(`POST /question falhou (${response.status}). ${text}`)
      }

      const payload: Item[] = await response.json()
      const first = payload?.[0]
      if (!first) return

      showAssistantToast(first.message ?? "")

      if (first.points?.length) {
        setPoints(payload)
      }

      setSearch("")
    } catch (error) {
      console.error(error)
      showAssistantToast("Ocorreu um erro ao consultar o assistente. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [search, loading, showAssistantToast])

  useEffect(() => {
    let cancelled = false

    const loadInitialPoints = async () => {
      try {
        const response = await fetch(START_URL)
        if (!response.ok) {
          throw new Error(`GET /start falhou (${response.status})`)
        }

        const payload: Item[] = await response.json()

        if (!cancelled) {
          setPoints(payload)
        }
      } catch (error) {
        console.error(error)
      }
    }

    loadInitialPoints()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadIndicators() {
      if (!indicatorsUrl) {
        setIndicatorsData({})
        return
      }

      try {
        const response = await fetch(indicatorsUrl)

        if (!response.ok) {
          throw new Error(`GET /indicators falhou (${response.status})`)
        }

        const payload = await response.json()

        if (!cancelled) {
          setIndicatorsData(payload ?? {})
        }
      } catch (error) {
        console.error("Erro ao carregar indicadores:", error)
        if (!cancelled) {
          setIndicatorsData({})
        }
      }
    }

    loadIndicators()

    return () => {
      cancelled = true
    }
  }, [indicatorsUrl])

  useEffect(() => {
    if (!Object.keys(indicatorsData).length) return

    setIndicatorLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        uf,
        minValue: INDICATOR_SCALE[layer.key].min,
        maxValue: getIndicatorMaxFromPayload(indicatorsData, layer.key),
      }))
    )
  }, [indicatorsData, uf])

  const handleToggleLayer = useCallback((key: IndicatorKey, next: boolean) => {
    setIndicatorLayers((prev) =>
      prev.map((layer) =>
        layer.key === key ? { ...layer, visible: next } : layer
      )
    )
  }, [])

  const handleChangeVisualization = useCallback(
    (key: IndicatorKey, next: VisualizationType) => {
      setIndicatorLayers((prev) =>
        prev.map((layer) =>
          layer.key === key ? { ...layer, visualization: next } : layer
        )
      )
    },
    []
  )

  const handleChangeColorScale = useCallback(
    (key: IndicatorKey, next: ColorScaleKey) => {
      setIndicatorLayers((prev) =>
        prev.map((layer) =>
          layer.key === key ? { ...layer, colorScale: next } : layer
        )
      )
    },
    []
  )

  return (
    <div className="relative h-screen w-full">
      <button
        onClick={() => setLayersControlCollapsed((prev) => !prev)}
        className="
          absolute left-4 top-10 z-[9999] w-[360px]
          bg-black/40 backdrop-blur-xl
          border border-white/10
          text-white
          px-4 py-2
          rounded-xl
          text-sm
          shadow-lg
          hover:bg-black/60
          transition
        "
        type="button"
      >
        {layersControlCollapsed ? "Mostrar indicadores" : "Ocultar indicadores"}
      </button>
      <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: "100vh", width: "100%" }}>
        <TileLayer url={TILE_LAYER_URL} />

        <MapIndicatorLayers
          layers={visibleIndicatorLayers}
          indicatorsData={indicatorsData}
          featureTipo={featureTipo}
        />

        <MarkersLayer data={points} />
      </MapContainer>

      <AssistantToast
        show={showToast}
        message={assistantReply}
        onClose={hideAssistantToast}
      />

      <SearchBar
        value={search}
        loading={loading}
        onChange={setSearch}
        onSend={onSend}
      />

      <LayersControl
        layers={indicatorLayers}
        onToggleLayer={handleToggleLayer}
        onChangeVisualization={handleChangeVisualization}
        onChangeColorScale={handleChangeColorScale}
        onChangeMaxValue={handleChangeMaxValue}
        featureTipo={featureTipo}
        onChangeFeatureTipo={setFeatureTipo}
        collapsed={layersControlCollapsed}
        uf={uf}
        onChangeUf={setUf}
      />
    </div>
  )
}