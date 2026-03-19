import { useEffect, useMemo, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.vectorgrid"

type IndicatorKey =
  | "empresas_total"
  | "empresas_por_km2"
  | "capital_sum"
  | "capital_avg"
  | "capital_p50"
  | "capital_p90"
  | "score_avg"
  | "score_p50"
  | "score_p90"
  | "cnae_principal_distintos"
  | "portes_distintos"
  | "naturezas_distintas"

type BairrosIndicadorLayerProps = {
  uf: string | number
  indicator: IndicatorKey
  baseUrl?: string
  minValue?: number
  maxValue?: number
  visible?: boolean
  minZoom?: number
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

const normalize01 = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return 0
  if (max <= min) return 0
  return clamp01((value - min) / (max - min))
}

const lerpHex = (from: string, to: string, t: number) => {
  const parse = (hex: string) => {
    const h = hex.replace("#", "")
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    }
  }

  const a = parse(from)
  const b = parse(to)

  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl
    .toString(16)
    .padStart(2, "0")}`
}

// calcula XYZ a partir do centro/zoom (padrão WebMercator tile scheme)
const getXYZFromMap = (map: L.Map) => {
  const z = map.getZoom()
  const center = map.getCenter()
  const tileSize = 256

  const projected = map.project(center, z)
  const x = Math.floor(projected.x / tileSize)
  const y = Math.floor(projected.y / tileSize)

  return { x, y, z }
}

const looksLikeText = (buf: ArrayBuffer) => {
  const u8 = new Uint8Array(buf)
  if (u8.length === 0) return true

  // gzip header (ok) 1F 8B
  if (u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b) return false

  // HTML "<"
  if (u8[0] === 0x3c) return true

  // JSON "{" or "["
  if (u8[0] === 0x7b || u8[0] === 0x5b) return true

  // se os primeiros bytes são ASCII imprimível demais, provavelmente texto
  const sample = u8.slice(0, Math.min(32, u8.length))
  let ascii = 0
  for (const b of sample) {
    if ((b >= 0x20 && b <= 0x7e) || b === 0x0a || b === 0x0d || b === 0x09) ascii++
  }
  return ascii / sample.length > 0.9
}

export function BairrosIndicadorLayer({
  uf,
  indicator,
  baseUrl = "https://tiles.opusapp.com.br",
  minValue = 0,
  maxValue = 100,
  visible = true,
  minZoom = 12,
}: BairrosIndicadorLayerProps) {
  const map = useMap()
  const gridRef = useRef<any>(null)
  const lastStyleKeyRef = useRef<string>("")

  const pbfUrl = useMemo(() => {
    const qs = new URLSearchParams({ uf: String(uf), indicator })
    return `${baseUrl}/tiles/bairros/{z}/{x}/{y}.pbf?${qs.toString()}`
  }, [uf, indicator, baseUrl])

  useEffect(() => {
    const styleKey = `${pbfUrl}::${minValue}::${maxValue}`

    const getValueFromProps = (props: any) => {
      const raw =
        props?.indicator_value ??
        props?.value ??
        props?.[indicator] ??
        props?.indicator ??
        0
      const n = Number(raw)
      return Number.isFinite(n) ? n : 0
    }

    const getFillColor = (v: number) => {
      const t = normalize01(v, minValue, maxValue)
      return lerpHex("#fee2e2", "#b91c1c", t)
    }

    const styleFor = (props: any) => {
      console.log("min/max em uso:", minValue, maxValue)
      const v = getValueFromProps(props)
      return {
        fill: true,
        fillColor: getFillColor(v),
        fillOpacity: 0.75,
        stroke: true,
        color: "#1e3a8a",
        opacity: 1,
        weight: 2,
      }
    }

    const onGridClick = (e: any) => {
      const props = e?.layer?.properties
      const latlng = e?.latlng
      if (!props || !latlng) return

      const bairro = props.nome_bairro ?? props.bairro ?? "Bairro"
      const municipio = props.nome_municipio ?? props.municipio ?? "-"
      const ufLabel = props.uf ?? uf
      const value = getValueFromProps(props)

      L.popup()
        .setLatLng(latlng)
        .setContent(`<b>${bairro}</b><br/>Município: ${municipio} (${ufLabel})<br/>${indicator}: ${value}`)
        .openOn(map)
    }

    const buildGrid = () => {
      const grid = (L as any).vectorGrid.protobuf(pbfUrl, {
        interactive: true,
        getFeatureId: (f: any) => f?.properties?.id ?? f?.properties?.gid ?? f?.id,
        vectorTileLayerStyles: {
          "*": styleFor,
          default: styleFor,
          bairros: styleFor,
        },
      })
      grid.on("click", onGridClick)
      return grid
    }

    const removeGrid = () => {
      if (!gridRef.current) return
      try {
        gridRef.current.off("click", onGridClick)
      } catch {}
      if (map.hasLayer(gridRef.current)) map.removeLayer(gridRef.current)
      gridRef.current = null
    }

    const ensureCorrectGrid = () => {
      // ✅ se mudou pbfUrl OU min/max, recria
      if (gridRef.current && lastStyleKeyRef.current !== styleKey) {
        removeGrid()
      }
      if (!gridRef.current) {
        gridRef.current = buildGrid()
        lastStyleKeyRef.current = styleKey
      }
    }

    const sync = () => {
      const zoomOk = map.getZoom() >= minZoom
      const shouldShow = visible && zoomOk

      if (!shouldShow) {
        removeGrid()
        return
      }

      ensureCorrectGrid()

      if (gridRef.current && !map.hasLayer(gridRef.current)) {
        gridRef.current.addTo(map)
      }
    }

    sync()
    map.on("zoomend", sync)

    return () => {
      map.off("zoomend", sync)
      removeGrid()
    }
  }, [map, pbfUrl, uf, indicator, visible, minZoom, minValue, maxValue])

  return null
}

// mantém compatibilidade se você já importou assim em algum lugar
export const BairrosIndicatorLayer = BairrosIndicadorLayer
