import type { IndicatorLayerConfig } from "./LayersControl"
import { Tiles } from "./Tiles"
import { HeatmapLayer } from "./HeatmapLayer"
import type { FeatureTipo, IndicatorPayload } from "./tiles.helpers"
import { CentroidLayer } from "./CentroidLayer"

export function MapIndicatorLayers({
  layers,
  indicatorsData,
  featureTipo,
}: {
  layers: IndicatorLayerConfig[]
  indicatorsData: IndicatorPayload
  featureTipo: FeatureTipo
}) {
  return (
    <>
      {layers.map((layer) => {
        if (layer.visualization === "choropleth") {
          return (
            <Tiles
              key={`${layer.key}-choropleth-${featureTipo}`}
              uf={layer.uf}
              featureTipo={featureTipo}
              indicators={[layer.key]}
              indicatorsData={indicatorsData}
              colorIndicator={layer.key}
              colorScale={layer.colorScale}
              visible={layer.visible}
              minZoom={layer.minZoom}
              minValue={layer.minValue}
              maxValue={layer.maxValue}
            />
          )
        }

        if (layer.visualization === "heatmap") {
          return (
            <HeatmapLayer
              key={`${layer.key}-heatmap-${featureTipo}`}
              indicator={layer}
              indicatorsData={indicatorsData}
              featureTipo={featureTipo}
            />
          )
        } else if (layer.visualization === "centroid") {
          return (
            <CentroidLayer
              key={`${layer.key}-centroid-${featureTipo}`}
              indicator={layer}
              indicatorsData={indicatorsData}
              featureTipo={featureTipo}
            />
          )
        }

        return null
      })}
    </>
  )
}