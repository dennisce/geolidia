import { useEffect, useMemo, useRef, useState } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.vectorgrid"

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
        if (!response.ok) {
          throw new Error(`Erro ao carregar indicadores: ${response.status}`)
        }

        const json = (await response.json()) as IndicatorPayload
        if (cancelled) return

        setIndicatorsData(json ?? {})
      } catch (error) {
        console.error("Erro ao carregar indicadores:", error)

        if (cancelled) return
        setIndicatorsData({})
      } finally {
        if (!cancelled) {
          setDataReady(true)
        }
      }
    }

    loadIndicators()

    return () => {
      cancelled = true
    }
  }, [indicatorsUrl, indicators])

  function handleClick(e: any) {
    const props = e?.layer?.properties
    const latlng = e?.latlng
    if (!props || !latlng) return

    const featureId = String(props.feature_id ?? "-")
    const nomeBairro = props.nome_bairro ?? "-"
    const nomeMunicipio = props.nome_municipio ?? "-"
    const tipo = props.feature_tipo ?? "-"

    const metricsHtml = indicators
      .map((indicatorName) => {
        const value = getIndicatorValue(indicatorsData, featureId, indicatorName)
        return `<br/>${indicatorName}: ${value}`
      })
      .join("")

    L.popup()
      .setLatLng(latlng)
      .setContent(
        `<b>${nomeBairro}</b><br/>Município: ${nomeMunicipio}<br/>Tipo: ${tipo}${metricsHtml}`
      )
      .openOn(map)
  }

  function removeLayer() {
    if (!gridRef.current) return

    try {
      gridRef.current.off("click", handleClick)
    } catch {}

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
      getFeatureId: (feature: any) => feature?.properties?.feature_id,
    })

    vectorGrid.on("click", handleClick)
    vectorGrid.addTo(map)
    gridRef.current = vectorGrid

    return () => {
      removeLayer()
    }
  }, [map, pbfUrl, styleFor, visible, dataReady, minZoom])

  return null
}