import { useEffect, useMemo, useRef, useState } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js"

import {
  buildIndicatorsUrl,
  buildPbfUrl,
  buildStyleFor,
  getIndicatorValue,
  MVT_LAYER_NAME,
  type IndicatorPayload,
  type TilesProps,
} from "./tiles.helpers"

export function Tiles({
  uf,
  codMun,
  featureTipo,
  indicators = [],
  colorIndicator,
  colorScale = "reds",
  baseUrl = "https://tiles.opusapp.com.br",
  visible = true,
  minZoom = 7,
  minValue = 0,
  maxValue = 100,
}: TilesProps) {
  const map = useMap()
  const gridRef = useRef<any>(null)

  const [indicatorsData, setIndicatorsData] = useState<IndicatorPayload>({})
  const [dataReady, setDataReady] = useState(false)

  const pbfUrl = useMemo(() => {
    return buildPbfUrl({
      baseUrl,
      uf,
      codMun,
      featureTipo,
    })
  }, [baseUrl, uf, codMun, featureTipo])

  const indicatorsUrl = useMemo(() => {
    return buildIndicatorsUrl({
      baseUrl,
      indicators,
      uf,
      codMun,
    })
  }, [baseUrl, indicators, uf, codMun])

  const styleFor = useMemo(() => {
    return buildStyleFor({
      indicators: indicatorsData,
      colorIndicator,
      colorScale,
      minValue,
      maxValue,
    })
  }, [indicatorsData, colorIndicator, colorScale, minValue, maxValue])

  useEffect(() => {
    let cancelled = false

    async function loadIndicators() {
      if (!indicatorsUrl || !indicators.length) {
        setIndicatorsData({})
        setDataReady(true)
        return
      }

      try {
        setDataReady(false)

        const response = await fetch(indicatorsUrl)
        const json = await response.json()

        if (cancelled) return
        setIndicatorsData(json ?? {})
      } catch (error) {
        console.error(error)
        if (!cancelled) setIndicatorsData({})
      } finally {
        if (!cancelled) setDataReady(true)
      }
    }

    loadIndicators()

    return () => {
      cancelled = true
    }
  }, [indicatorsUrl, indicators])

  function removeLayer() {
    if (!gridRef.current) return
    if (map.hasLayer(gridRef.current)) {
      map.removeLayer(gridRef.current)
    }
    gridRef.current = null
  }

  useEffect(() => {
    if (!visible || !dataReady) {
      removeLayer()
      return
    }

    removeLayer()

    const vectorGrid = (L as any).vectorGrid.protobuf(pbfUrl, {
      interactive: true,
      minZoom,
      vectorTileLayerStyles: {
        [MVT_LAYER_NAME]: styleFor,
      },
    })

    vectorGrid.addTo(map)
    gridRef.current = vectorGrid

    return () => removeLayer()
  }, [map, pbfUrl, styleFor, visible, dataReady, minZoom])

  return null
}