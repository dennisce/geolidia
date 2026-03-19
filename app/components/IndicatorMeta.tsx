import type { IndicatorKey } from "./LayersControl"

export const INDICATOR_META: Record<
  IndicatorKey,
  { label: string; desc: string; min: number; max: number }
> = {
  total_domicilios: {
    label: "Total de domicílios (total)",
    desc: "Quantidade total de domicílios no bairro ou setor censitário.",
    min: 0,
    max: 5000,
  },
  renda_media_setor: {
    label: "Renda média do setor",
    desc: "Renda média do setor no bairro ou setor censitário.",
    min: 0,
    max: 80000,
  },
}
