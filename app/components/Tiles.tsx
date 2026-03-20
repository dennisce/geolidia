import { useEffect, useMemo, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js"

import {
  buildPbfUrl,
  buildStyleFor,
  MVT_LAYER_NAME,
  type TilesProps,
} from "./tiles.helpers"

export function Tiles({
  uf,
  codMun,
  featureTipo,
  indicators = [],
  indicatorsData = {},
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

  const pbfUrl = useMemo(() => {
    return buildPbfUrl({
      baseUrl,
      uf,
      codMun,
      featureTipo,
    })
  }, [baseUrl, uf, codMun, featureTipo])

  const styleFor = useMemo(() => {
    return buildStyleFor({
      indicators: indicatorsData,
      colorIndicator,
      colorScale,
      minValue,
      maxValue,
    })
  }, [indicatorsData, colorIndicator, colorScale, minValue, maxValue])

  function removeLayer() {
    if (!gridRef.current) return
    if (map.hasLayer(gridRef.current)) {
      map.removeLayer(gridRef.current)
    }
    gridRef.current = null
  }

  useEffect(() => {
    if (!visible) {
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

    const handleClick = (event: any) => {
      const properties = event?.layer?.properties
      const latlng = event?.latlng

      if (!properties || !latlng) return

      const featureId = properties.feature_id
      const indicatorItem = featureId ? indicatorsData?.[featureId] : null

      const localLabel =
        properties.feature_tipo === "setor"
          ? "Setor censitário"
          : properties.nome_bairro || "Bairro"

      const nomeMunicipio = properties.nome_municipio ?? "-"
      const ufValue = properties.uf ?? uf

      const hiddenFields = new Set([
        "feature_id",
        "feature_tipo",
        "cod_municipio_ibge",
        "nome_municipio",
        "nome_bairro",
        "uf",
        "lat",
        "lon",
      ])

      const indicatorsHtml = indicatorItem
        ? Object.entries(indicatorItem)
            .filter(([key, value]) => {
              if (hiddenFields.has(key)) return false
              if (value === null || value === undefined || value === "") return false
              return true
            })
            .map(([key, value]) => {
              const label = key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())

              return `<div><b>${label}:</b> ${value}</div>`
            })
            .join("")
        : "<div>Sem indicadores disponíveis</div>"

      L.popup()
        .setLatLng(latlng)
        .setContent(`
          <div>
            <b>${nomeMunicipio} (${ufValue})</b><br/>
            ${localLabel}<br/><br/>
            ${indicatorsHtml}
          </div>
        `)
        .openOn(map)
    }

    vectorGrid.on("click", handleClick)

    gridRef.current = vectorGrid

    return () => removeLayer()
  }, [
    map,
    pbfUrl,
    styleFor,
    visible,
    minZoom,
    indicatorsData,
    uf,
    indicators,
  ])

  return null
}