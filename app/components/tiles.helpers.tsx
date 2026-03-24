export type FeatureTipo = "bairro" | "setor" | "bairro,setor"

export type IndicatorRow = {
  uf?: string
  cod_municipio_ibge?: number
  nome_bairro?: string
  lat?: number | string
  lon?: number | string
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

export const COLOR_SCALES = {
  reds: {
    label: "Vermelho",
    colors: ["#fee2e2", "#fecaca", "#fca5a5", "#ef4444", "#b91c1c"],
  },
  blues: {
    label: "Azul",
    colors: ["#dbeafe", "#93c5fd", "#60a5fa", "#2563eb", "#1d4ed8"],
  },
  greens: {
    label: "Verde",
    colors: ["#dcfce7", "#86efac", "#4ade80", "#16a34a", "#166534"],
  },
  purples: {
    label: "Roxo",
    colors: ["#f3e8ff", "#d8b4fe", "#c084fc", "#9333ea", "#6b21a8"],
  },
  oranges: {
    label: "Laranja",
    colors: ["#ffedd5", "#fdba74", "#fb923c", "#ea580c", "#9a3412"],
  },
  teal: {
    label: "Turquesa",
    colors: ["#ccfbf1", "#99f6e4", "#5eead4", "#0d9488", "#115e59"],
  },
  pink: {
    label: "Rosa",
    colors: ["#fce7f3", "#f9a8d4", "#f472b6", "#db2777", "#9d174d"],
  },
  slate: {
    label: "Cinza",
    colors: ["#e2e8f0", "#cbd5e1", "#94a3b8", "#475569", "#1e293b"],
  },
  yellow: {
    label: "Amarelo",
    colors: ["#fef9c3", "#fde68a", "#facc15", "#ca8a04", "#854d0e"],
  },
  indigo: {
    label: "Índigo",
    colors: ["#e0e7ff", "#a5b4fc", "#818cf8", "#4f46e5", "#312e81"],
  },
}

export function getColorScale(key: ColorScaleKey) {
  return COLOR_SCALES[key]
}

export function getColorScaleColors(key: ColorScaleKey): string[] {
  return COLOR_SCALES[key].colors
}

export function getColorScaleLabel(key: ColorScaleKey): string {
  return COLOR_SCALES[key].label
}

export type TilesProps = {
  uf?: string | number
  codMun?: number
  featureTipo?: FeatureTipo
  indicators?: string[]
  indicatorsData?: IndicatorPayload
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
  scale: string[] = getColorScaleColors("reds")
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
    qs.set("feature_tipo", featureTipo)
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
    const palette = getColorScale(colorScale) ?? getColorScale("reds")

    return {
      fill: true,
      fillColor: getColor(value, minValue, maxValue, palette.colors),
      fillOpacity: tipo === "setor" ? 0.45 : 0.7,
      stroke: true,
      color: tipo === "setor" ? "#2563eb" : "#1e3a8a",
      opacity: 1,
      weight: tipo === "setor" ? 0.5 : 1,
    }
  }
}

export const VISUALIZATIONS = {
  choropleth: {
    label: "Coroplético",
    icon: "map",
    description: "Coloração por área",
  },
  centroid: {
    label: "Centroides proporcionais",
    icon: "dot",
    description: "Pontos proporcionais ao valor",
  },
  heatmap: {
    label: "Mapa de calor",
    icon: "fire",
    description: "Distribuição de calor por ocorrência em área",
  },
} as const

export type VisualizationType = keyof typeof VISUALIZATIONS

export function getVisualizationLabel(type: VisualizationType): string {
  return VISUALIZATIONS[type]?.label ?? type
}

export type UfCode =
  | 11 | 12 | 13 | 14 | 15 | 16 | 17
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 
  | 28 | 29 | 31 | 32 | 33 | 35 | 41 
  | 42 | 43 | 50 | 51 | 52 | 53

export const UF_OPTIONS: Array<{
  code: UfCode
  sigla: string
  label: string
}> = [
  { code: 11, sigla: "RO", label: "Rondônia" },
  { code: 12, sigla: "AC", label: "Acre" },
  { code: 13, sigla: "AM", label: "Amazonas" },
  { code: 14, sigla: "RR", label: "Roraima" },
  { code: 15, sigla: "PA", label: "Pará" },
  { code: 16, sigla: "AP", label: "Amapá" },
  { code: 17, sigla: "TO", label: "Tocantins" },
  { code: 21, sigla: "MA", label: "Maranhão" },
  { code: 22, sigla: "PI", label: "Piauí" },
  { code: 23, sigla: "CE", label: "Ceará" },
  { code: 24, sigla: "RN", label: "Rio Grande do Norte" },
  { code: 25, sigla: "PB", label: "Paraíba" },
  { code: 26, sigla: "PE", label: "Pernambuco" },
  { code: 27, sigla: "AL", label: "Alagoas" },
  { code: 28, sigla: "SE", label: "Sergipe" },
  { code: 29, sigla: "BA", label: "Bahia" },
  { code: 31, sigla: "MG", label: "Minas Gerais" },
  { code: 32, sigla: "ES", label: "Espírito Santo" },
  { code: 33, sigla: "RJ", label: "Rio de Janeiro" },
  { code: 35, sigla: "SP", label: "São Paulo" },
  { code: 41, sigla: "PR", label: "Paraná" },
  { code: 42, sigla: "SC", label: "Santa Catarina" },
  { code: 43, sigla: "RS", label: "Rio Grande do Sul" },
  { code: 50, sigla: "MS", label: "Mato Grosso do Sul" },
  { code: 51, sigla: "MT", label: "Mato Grosso" },
  { code: 52, sigla: "GO", label: "Goiás" },
  { code: 53, sigla: "DF", label: "Distrito Federal" },
]