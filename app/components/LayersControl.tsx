import { HelpTip } from "./HelpTip"
import type { ColorScaleKey } from "./tiles.helpers"

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
  collapsed = false,
}: Props) {
  return (
    <div className={`
                    absolute left-4 top-24 z-[9999] w-[360px]
                    bg-black/40 backdrop-blur-xl
                    border border-white/10
                    rounded-2xl
                    shadow-[0_0_40px_rgba(124,58,237,0.15)]
                    overflow-hidden
                    transition-all duration-300
                    ${collapsed ? "w-0 opacity-0 pointer-events-none p-0 border-transparent" : "w-[360px] opacity-100 p-4"}
                  `}>
      <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-xl">
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Camadas</h3>
          <p className="mt-1 text-xs text-gray-500">
            Ative/desative indicadores e escolha o tipo de visualização.
          </p>
        </div>

        <div className="max-h-[70vh] overflow-auto p-2 space-y-2">
          {layers.map((layer) => (
            <div
              key={layer.key}
              className="rounded-xl border border-gray-100 bg-white shadow-sm px-3 py-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {layer.label}
                    </span>
                    <HelpTip text={layer.desc} />
                  </div>

                  <div className="text-[11px] text-gray-500 truncate">
                    UF: {layer.uf} • {layer.key}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-600 shrink-0">
                  <span>{layer.visible ? "Ativa" : "Inativa"}</span>
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={(e) => onToggleLayer(layer.key, e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-medium text-gray-600">
                  Visualização
                </div>
                <select
                  value={layer.visualization}
                  onChange={(e) =>
                    onChangeVisualization(
                      layer.key,
                      e.target.value as VisualizationType
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-500"
                >
                  {layer.supportedVisualizations.map((v) => (
                    <option key={v} value={v}>
                      {v === "choropleth" ? "Mapa por região" : "Mapa de calor"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-medium text-gray-600">Cor</div>

                <div className="grid grid-cols-2 gap-2">
                  {COLOR_OPTIONS.map((option) => {
                    const selected = layer.colorScale === option.key

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => onChangeColorScale(layer.key, option.key)}
                        className={[
                          "rounded-xl border px-2 py-2 text-left transition",
                          selected
                            ? "border-violet-500 ring-2 ring-violet-200 bg-violet-50"
                            : "border-gray-200 hover:border-gray-300 bg-white",
                        ].join(" ")}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-800">
                            {option.label}
                          </span>
                          {selected && (
                            <span className="text-[10px] font-semibold text-violet-600">
                              Ativa
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-5 overflow-hidden rounded-md">
                          {option.preview.map((color) => (
                            <div
                              key={color}
                              className="h-4"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-500">
            Dica: passe o mouse no <span className="font-semibold">?</span> para ver a descrição.
          </p>
        </div>
      </div>
    </div>
  )
}