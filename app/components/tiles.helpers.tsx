export type FeatureTipo = "bairro" | "setor"

export type IndicatorRow = {
  uf?: string
  cod_municipio_ibge?: number
  nome_bairro?: string
  [key: string]: string | number | undefined
}

export type IndicatorPayload = Record<string, IndicatorRow>

export type ColorScaleKey =
  | "reds"
  | "blues"
  | "greens"
  | "purples"
  | "oranges"
  | "teal"
  | "pink"
  | "slate"
  | "yellow"
  | "indigo"

export const COLOR_SCALES: Record<ColorScaleKey, string[]> = {
  reds: ["#fee2e2", "#fecaca", "#fca5a5", "#ef4444", "#b91c1c"],
  blues: ["#dbeafe", "#93c5fd", "#60a5fa", "#2563eb", "#1d4ed8"],
  greens: ["#dcfce7", "#86efac", "#4ade80", "#16a34a", "#166534"],
  purples: ["#f3e8ff", "#d8b4fe", "#c084fc", "#9333ea", "#6b21a8"],
  oranges: ["#ffedd5", "#fdba74", "#fb923c", "#ea580c", "#9a3412"],
  teal: ["#ccfbf1", "#99f6e4", "#5eead4", "#0d9488", "#115e59"],
  pink: ["#fce7f3", "#f9a8d4", "#f472b6", "#db2777", "#9d174d"],
  slate: ["#e2e8f0", "#cbd5e1", "#94a3b8", "#475569", "#1e293b"],
  yellow: ["#fef9c3", "#fde68a", "#facc15", "#ca8a04", "#854d0e"],
  indigo: ["#e0e7ff", "#a5b4fc", "#818cf8", "#4f46e5", "#312e81"],
}

export type TilesProps = {
  uf?: string | number
  codMun?: number
  featureTipo?: FeatureTipo
  indicators?: string[]
  colorIndicator?: string
  colorScale?: ColorScaleKey
  baseUrl?: string
  visible?: boolean
  minZoom?: number
  minValue?: number
  maxValue?: number
}

export const MVT_LAYER_NAME = "bairros"

export function getIndicatorValue(
  indicators: IndicatorPayload,
  featureId: string,
  indicator?: string
): number {
  if (!indicator) return 0

  const row = indicators[featureId]
  if (!row) return 0

  const value = Number(row[indicator])
  return Number.isFinite(value) ? value : 0
}

export function getColor(
  value: number,
  minValue: number,
  maxValue: number,
  scale: string[] = COLOR_SCALES.reds
): string {
  if (!Number.isFinite(value)) return scale[0]
  if (maxValue <= minValue) return scale[0]

  const ratio = (value - minValue) / (maxValue - minValue)

  if (ratio <= 0.2) return scale[0]
  if (ratio <= 0.4) return scale[1]
  if (ratio <= 0.6) return scale[2]
  if (ratio <= 0.8) return scale[3]
  return scale[4]
}

export function buildPbfUrl(params: {
  baseUrl: string
  uf?: string | number
  codMun?: number
  featureTipo?: FeatureTipo
}): string {
  const { baseUrl, uf, codMun, featureTipo } = params
  const qs = new URLSearchParams()

  if (uf !== undefined && uf !== null) {
    qs.set("uf", String(uf))
  }

  if (codMun !== undefined && codMun !== null) {
    qs.set("cod_mun", String(codMun))
  }

  if (featureTipo) {
    qs.set("feature_tipo", ["bairro", "setor"].join(","))
  }

  return `${baseUrl}/tiles/map-features/{z}/{x}/{y}.pbf?${qs.toString()}`
}

export function buildIndicatorsUrl(params: {
  baseUrl: string
  indicators?: string[]
  uf?: string | number
  codMun?: number
}): string | null {
  const { baseUrl, indicators, uf, codMun } = params

  const validIndicators = (indicators ?? []).map((i) => i.trim()).filter(Boolean)
  if (!validIndicators.length) return null

  const qs = new URLSearchParams()
  qs.set("indicators", validIndicators.join(","))

  if (uf !== undefined && uf !== null) {
    qs.set("uf", String(uf))
  }

  if (codMun !== undefined && codMun !== null) {
    qs.set("cod_mun", String(codMun))
  }

  return `${baseUrl}/indicators?${qs.toString()}`
}

type StyleForParams = {
  indicators: IndicatorPayload
  colorIndicator?: string
  colorScale?: ColorScaleKey
  minValue: number
  maxValue: number
}

type VectorTileProps = {
  feature_tipo?: string
  feature_id?: string
  [key: string]: unknown
}

export function buildStyleFor({
  indicators,
  colorIndicator,
  colorScale = "reds",
  minValue,
  maxValue,
}: StyleForParams) {
  return function styleFor(props: VectorTileProps) {
    const tipo = props?.feature_tipo
    const featureId = String(props?.feature_id ?? "")
    const value = getIndicatorValue(indicators, featureId, colorIndicator)
    const palette = COLOR_SCALES[colorScale] ?? COLOR_SCALES.reds

    return {
      fill: true,
      fillColor: getColor(value, minValue, maxValue, palette),
      fillOpacity: tipo === "setor" ? 0.45 : 0.7,
      stroke: true,
      color: tipo === "setor" ? "#2563eb" : "#1e3a8a",
      opacity: 1,
      weight: tipo === "setor" ? 0.5 : 1,
    }
  }
}