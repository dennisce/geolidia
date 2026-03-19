import { useEffect } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.vectorgrid"

type BairrosLayerProps = {
  uf: string | number
  baseUrl?: string
}

export function BairrosLayer({ uf, baseUrl = "https://tiles.opusapp.com.br" }: BairrosLayerProps) {
  const map = useMap()

  useEffect(() => {
    const tileUrl = `${baseUrl}/tiles/bairros/{z}/{x}/{y}.pbf?uf=${uf}`

    const bairrosVectorTiles = (L as any).vectorGrid.protobuf(tileUrl, {
      vectorTileLayerStyles: {
        bairros: {
          weight: 2.5,
          color: "#1e3a8a",
          opacity: 1,
          fillColor: "#ef4444",
          fillOpacity: 0.15,
        },
      },
      interactive: true,
      getFeatureId: (feature: any) => feature.properties.id,
    })

    bairrosVectorTiles.addTo(map)

    const handleClick = (event: any) => {
      const properties = event?.layer?.properties
      const latlng = event?.latlng
      if (!properties || !latlng) return

      const nomeBairro = properties.nome_bairro ?? "Bairro"
      const nomeMunicipio = properties.nome_municipio ?? "-"
      const ufValue = properties.uf ?? uf

      L.popup()
        .setLatLng(latlng)
        .setContent(
          `<b>${nomeBairro}</b><br/>Município: ${nomeMunicipio} (${ufValue})`
        )
        .openOn(map)
    }

    bairrosVectorTiles.on("click", handleClick)

    return () => {
      bairrosVectorTiles.off("click", handleClick)
      map.removeLayer(bairrosVectorTiles)
    }
  }, [map, uf, baseUrl])

  return null
}
