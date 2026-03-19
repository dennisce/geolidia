import type { IndicatorLayerConfig } from "./LayersControl"
import { Tiles } from "./Tiles"
import { HeatmapLayer } from "./HeatmapLayer"

export function MapIndicatorLayers({
  layers,
  colorScale,
}: {
  layers: IndicatorLayerConfig[]
  colorScale: any
}) {
  return (
    <>
      {layers.map((layer) => {
        if (layer.visualization === "choropleth") {
          return (
            <Tiles
              key={layer.key}
              uf={layer.uf}
              indicators={[layer.key]}
              colorIndicator={layer.key}
              colorScale={layer.colorScale}
              visible={true}
              minZoom={layer.minZoom}
              minValue={layer.minValue}
              maxValue={layer.maxValue}
            />
          )
        }

        if (layer.visualization === "heatmap") {
          return (
            <HeatmapLayer
              key={layer.key}
              indicator={layer}
            />
          )
        }

        return null
      })}
    </>
  )
}