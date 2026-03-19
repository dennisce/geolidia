type ColorScaleOption = {
  key: string
  label: string
  colors: string[]
}

type ColorScaleSelectorProps = {
  options: ColorScaleOption[]
  selectedKey: string
  onChange: (key: string) => void
}

export function ColorScaleSelector({
  options,
  selectedKey,
  onChange,
}: ColorScaleSelectorProps) {
  return (
    <div className="absolute right-4 top-24 z-[9999] w-[320px]">
      <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-xl">
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Paleta de cores</h3>
          <p className="mt-1 text-xs text-gray-500">
            Escolha a cor usada para pintar o indicador ativo.
          </p>
        </div>

        <div className="max-h-[50vh] overflow-auto p-2 space-y-2">
          {options.map((option) => {
            const isActive = option.key === selectedKey

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onChange(option.key)}
                className={[
                  "w-full rounded-xl border px-3 py-3 text-left transition",
                  isActive
                    ? "border-violet-500 bg-violet-50"
                    : "border-gray-200 bg-white hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {option.label}
                  </span>
                  {isActive && (
                    <span className="text-[11px] font-semibold text-violet-700">
                      Ativa
                    </span>
                  )}
                </div>

                <div className="mt-2 flex overflow-hidden rounded-lg border border-gray-100">
                  {option.colors.map((color, index) => (
                    <div
                      key={`${option.key}-${index}`}
                      className="h-4 flex-1"
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
  )
}