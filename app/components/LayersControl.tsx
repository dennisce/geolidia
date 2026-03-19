import { HelpTip } from "./HelpTip"

export type IndicatorKey =
  | "total_domicilios"
  | "renda_media"

export type IndicatorLayerConfig = {
  key: IndicatorKey
  label: string
  desc: string
  uf: string | number
  visible: boolean
  minZoom?: number
  minValue?: number
  maxValue?: number
}

export function LayersControl({
  layers,
  onToggleLayer,
}: {
  layers: IndicatorLayerConfig[]
  onToggleLayer: (key: IndicatorKey, next: boolean) => void
}) {
  return (
    <div className="absolute left-4 top-24 z-[9999] w-[340px]">
      <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-xl">
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Camadas</h3>
          <p className="mt-1 text-xs text-gray-500">
            Ative/desative os indicadores exibidos no mapa e no popup.
          </p>
        </div>

        <div className="max-h-[65vh] overflow-auto p-2 space-y-1">
          {layers.map((layer) => (
            <div
              key={layer.key}
              className={[
                "rounded-xl border border-gray-100 bg-white shadow-sm",
                "px-3 py-2 flex items-center justify-between gap-3",
                "hover:bg-gray-50 transition",
              ].join(" ")}
            >
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
          ))}
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-500">
            O primeiro indicador ativo é usado para colorir as tiles.
          </p>
        </div>
      </div>
    </div>
  )
}