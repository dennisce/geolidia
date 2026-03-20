import { HelpTip } from "./HelpTip"
import type { ColorScaleKey, FeatureTipo } from "./tiles.helpers"

export type IndicatorKey =
  | "total_domicilios"
  | "renda_media"

export type VisualizationType = "choropleth" | "heatmap"

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

export function LayersControl({
  layers,
  onToggleLayer,
  onChangeVisualization,
  onChangeColorScale,
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
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Camadas</h3>
          <p className="mt-1 text-xs text-gray-500">
            Ative/desative indicadores e escolha o tipo de visualização.
          </p>
        </div>

        <div className="px-4 py-4 border-b border-gray-100">
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

        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 space-y-4">
          {layers.map((layer) => (
            <div
              key={layer.key}
              className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">{layer.label}</h4>
                    <HelpTip text={layer.desc} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{layer.desc}</p>
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

              <div className="mt-4 space-y-3">
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
                        {option === "choropleth" ? "Coroplético" : "Mapa de calor"}
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

                  <div className="mt-2 flex h-2 overflow-hidden rounded-full">
                    {(COLOR_OPTIONS.find((c) => c.key === layer.colorScale)?.preview ?? []).map(
                      (color) => (
                        <div
                          key={color}
                          className="h-full flex-1"
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}