import { HelpTip } from "./HelpTip"
import type { ColorScaleKey, FeatureTipo } from "./tiles.helpers"
import { getVisualizationLabel, getColorScaleColors } from "./tiles.helpers"
export type IndicatorKey =
  | "total_domicilios"
  | "renda_media"

export type VisualizationType = "choropleth" | "heatmap" | "centroid"

export type IndicatorLayerConfig = {
  key: IndicatorKey
  label: string
  desc: string
  uf: string | number
  visible: boolean
  visualization: VisualizationType
  supportedVisualizations: VisualizationType[]
  colorScale: ColorScaleKey
  minZoom?: number
  minValue?: number
  maxValue?: number
}

type Props = {
  layers: IndicatorLayerConfig[]
  onToggleLayer: (key: IndicatorKey, next: boolean) => void
  onChangeVisualization: (key: IndicatorKey, next: VisualizationType) => void
  onChangeColorScale: (key: IndicatorKey, next: ColorScaleKey) => void
  onChangeMaxValue: (key: IndicatorKey, next: number | undefined) => void
  featureTipo: FeatureTipo
  onChangeFeatureTipo: (next: FeatureTipo) => void
  collapsed?: boolean
}

const COLOR_OPTIONS: Array<{
  key: ColorScaleKey
  label: string
  preview: string[]
}> = [
  {
    key: "reds",
    label: "Vermelho",
    preview: ["#fee2e2", "#fecaca", "#fca5a5", "#ef4444", "#b91c1c"],
  },
  {
    key: "blues",
    label: "Azul",
    preview: ["#dbeafe", "#93c5fd", "#60a5fa", "#2563eb", "#1d4ed8"],
  },
  {
    key: "greens",
    label: "Verde",
    preview: ["#dcfce7", "#86efac", "#4ade80", "#16a34a", "#166534"],
  },
  {
    key: "purples",
    label: "Roxo",
    preview: ["#f3e8ff", "#d8b4fe", "#c084fc", "#9333ea", "#6b21a8"],
  },
  {
    key: "oranges",
    label: "Laranja",
    preview: ["#ffedd5", "#fdba74", "#fb923c", "#ea580c", "#9a3412"],
  },
  {
    key: "teal",
    label: "Turquesa",
    preview: ["#ccfbf1", "#99f6e4", "#5eead4", "#0d9488", "#115e59"],
  },
]

function parseMaxValueInput(value: string): number | undefined {
  if (!value.trim()) return undefined

  const normalized = value.replace(",", ".")
  const parsed = Number(normalized)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined
  }

  return parsed
}

export function LayersControl({
  layers,
  onToggleLayer,
  onChangeVisualization,
  onChangeColorScale,
  onChangeMaxValue,
  featureTipo,
  onChangeFeatureTipo,
  collapsed = false,
}: Props) {
  return (
    <div className="absolute left-4 top-24 z-[9999] w-[360px]">
      <div
        className={`
          rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-xl
          overflow-hidden transition-all duration-300
          ${collapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[90vh] opacity-100"}
        `}
      >
        <div className="border-b border-gray-100 px-4 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Camadas</h3>
          <p className="mt-1 text-xs text-gray-500">
            Ative/desative indicadores e escolha o tipo de visualização.
          </p>
        </div>

        <div className="border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">Geometrias exibidas</span>
            <HelpTip text="Aplica a visualização de bairros e setores censitários para todos os indicadores do mapa." />
          </div>

          <div className="mt-3">
            <select
              value={featureTipo}
              onChange={(e) => onChangeFeatureTipo(e.target.value as FeatureTipo)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-violet-400"
            >
              <option value="bairro">Apenas bairros</option>
              <option value="bairro,setor">Bairros e setores censitários</option>
              <option value="setor">Apenas setores censitários</option>
            </select>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 py-4">
          {layers.map((layer) => {
            const previewColors =
              getColorScaleColors(layer.colorScale) ?? []

            const minValue = layer.minValue ?? 0
            const maxValue = layer.maxValue ?? 0

            return (
              <div
                key={layer.key}
                className="rounded-xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-gray-900">
                        {layer.label}
                      </h4>

                      {layer.visible && <HelpTip text={layer.desc} />}
                    </div>
                  </div>

                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={layer.visible}
                      onChange={(e) => onToggleLayer(layer.key, e.target.checked)}
                    />
                    <div className="peer relative h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-violet-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>

                <div
                  className={`
                    overflow-hidden transition-all duration-300
                    ${layer.visible ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
                  `}
                >
                  <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-2">
                    <p className="text-xs text-gray-500">{layer.desc}</p>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Visualização
                      </label>
                      <select
                        value={layer.visualization}
                        onChange={(e) =>
                          onChangeVisualization(layer.key, e.target.value as VisualizationType)
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-violet-400"
                      >
                        {layer.supportedVisualizations.map((option) => (
                          <option key={option} value={option}>
                            {getVisualizationLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Escala de cor
                      </label>
                      <select
                        value={layer.colorScale}
                        onChange={(e) =>
                          onChangeColorScale(layer.key, e.target.value as ColorScaleKey)
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-violet-400"
                      >
                        {COLOR_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <label className="block text-xs font-medium text-gray-600">
                          Valor máximo da escala
                        </label>
                        <HelpTip text="O início da escala é sempre 0. Defina aqui o valor máximo usado para colorir o mapa." />
                      </div>

                      <input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={layer.maxValue ?? ""}
                        onChange={(e) =>
                          onChangeMaxValue(
                            layer.key,
                            parseMaxValueInput(e.target.value)
                          )
                        }
                        placeholder="Ex.: 500"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-violet-400"
                      />

                      <div className="mt-2 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        <div className="flex h-2 overflow-hidden">
                          {previewColors.map((color) => (
                            <div
                              key={color}
                              className="h-full flex-1"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-500">
                          <span>{minValue}</span>
                          <span>{maxValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}