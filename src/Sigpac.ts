import fetch from "node-fetch";
import * as globalMercator from "global-mercator";
import { transformCoords } from "./util/transformCoords.js";
import { config } from "./config.js";
import {
  ConfigUser,
  Consulta,
  Geojson,
  CapaLocalizacion,
  CapaConsulta,
  Coordenadas,
  DatosBusqueda,
  DatosConsultaParcela,
  DatosConsultaRecinto,
  DatosConsultaDeclaracion,
} from "./types.js";

const url = "https://sigpac.mapa.es";

/**
 * Devuelve un geojson con las datos de la localización
 * @param {CapaLocalizacion} capa Capa de los datos [  parcela, recinto, declaracion, red_natura, montanera, nitratos, fitosanitarios, pastos_permanentes, e_paisaje_linea, sie, mfe, cp_no_integradas ]
 * @param {Coordenadas} coords Objeto con la longitud y latitud [ lng, lat ]
 * @param {ConfigUser} configUser Objeto con la configuración del usuario para sobreescribir la original [ transformCoords, projection, proxy ]
 * @returns {Geojson} Objeto con el geojson de las parcelas
 */
const localizacion = async (
  capa: CapaLocalizacion,
  coords: Coordenadas,
  configUser?: ConfigUser
): Promise<Geojson> => {
  const { lng, lat } = coords;
  const configOverride = { ...config, ...configUser };

  if (!lng || !lat || !capa) {
    throw new Error("Datos incorrectos.");
  }
  const tiles = globalMercator.lngLatToTile([Number(lng), Number(lat)], 15);
  const options = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };

  let response = await fetch(
    (configOverride.proxy ? "" : url) +
      `/vectorsdg/vector/${capa}@3857/15.${tiles[0]}.${tiles[1]}.geojson`,
    options
  );
  let geojson = (await response.json()) as Geojson;

  return configOverride.transformCoords && configOverride.projection
    ? transformCoords(geojson, configOverride.projection)
    : geojson;
};

/**
 * Devuelve un geojson con los datos
 * @param {DatosBusqueda} data Objeto con los datos para el filtro [ comunidad, provincia, municipio, poligono, parcela ]
 * @param {ConfigUser} configUser Objeto con la configuración del usuario para sobreescribir la original [ proxy ]
 * @returns {Geojson} Objeto con los datos de la busqueda
 */
const buscar = async (
  data: DatosBusqueda,
  configUser?: ConfigUser
): Promise<Geojson> => {
  const { comunidad, provincia, municipio, poligono, parcela } = data;
  const configOverride = { ...config, ...configUser };

  const options = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };
  if (comunidad) {
    if (provincia) {
      if (municipio) {
        if (poligono) {
          if (parcela) {
            let response = await fetch(
              (configOverride.proxy ? "" : url) +
                `/fega/ServiciosVisorSigpac/query/recintos/${provincia}/${municipio}/0/0/${poligono}/${parcela}`,
              options
            );
            let geojson = await response.json();
            return geojson;
          } else {
            let response = await fetch(
              (configOverride.proxy ? "" : url) +
                `/fega/ServiciosVisorSigpac/query/parcelas/${provincia}/${municipio}/0/0/${poligono}`,
              options
            );
            let geojson = await response.json();
            return geojson;
          }
        } else {
          let response = await fetch(
            (configOverride.proxy ? "" : url) +
              `/fega/ServiciosVisorSigpac/query/poligonos/${provincia}/${municipio}/0/0`,
            options
          );
          let geojson = await response.json();
          return geojson;
        }
      } else {
        let response = await fetch(
          (configOverride.proxy ? "" : url) +
            `/fega/ServiciosVisorSigpac/query/municipios/${provincia}`,
          options
        );
        let geojson = await response.json();
        return geojson;
      }
    } else {
      let response = await fetch(
        (configOverride.proxy ? "" : url) +
          `/fega/ServiciosVisorSigpac/query/provincias/${comunidad}`,
        options
      );
      let geojson = await response.json();
      return geojson;
    }
  } else {
    throw new Error('Se esperaba parametro "comunidad"');
  }
};

/**
 * Devuelve un json con los datos de la capa
 * @param {CapaConsulta} capa Capa de los datos [  parcela, recinto, infodeclaracion ]
 * @param {DatosConsultaParcela | DatosConsultaRecinto | DatosConsultaDeclaracion} data Objeto con los datos requeridos segun la capa
 * @param {ConfigUser} configUser Objeto con la configuración del usuario para sobreescribir la original [ proxy ]
 * @returns {Consulta} Objeto con la información de la parcela, recinto o declaracion
 */
async function consulta(
  capa: "parcela",
  data: DatosConsultaParcela,
  configUser?: ConfigUser
): Promise<Consulta>;

async function consulta(
  capa: "recinto",
  data: DatosConsultaRecinto,
  configUser?: ConfigUser
): Promise<Consulta>;

async function consulta(
  capa: "infodeclaracion",
  data: DatosConsultaDeclaracion,
  configUser?: ConfigUser
): Promise<Consulta>;

async function consulta(
  capa: CapaConsulta,
  data: DatosConsultaParcela | DatosConsultaRecinto | DatosConsultaDeclaracion,
  configUser?: ConfigUser
): Promise<Consulta> {
  const configOverride = { ...config, ...configUser };

  if (capa == "parcela") {
    const parcela = data as DatosConsultaParcela;
    const {
      provincia,
      agregado,
      zona,
      municipio,
      poligono,
      parcela: parcelaId,
    } = parcela;
    if (
      provincia == undefined ||
      agregado == undefined ||
      zona == undefined ||
      municipio == undefined ||
      poligono == undefined ||
      parcelaId == undefined ||
      capa == undefined
    ) {
      throw new Error("Datos incorrectos");
    }
    const options = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    let response = await fetch(
      (configOverride.proxy ? "" : url) +
        `/fega/ServiciosVisorSigpac/LayerInfo/${capa}/${provincia},${municipio},${agregado},${zona},${poligono},${parcelaId}`,
      options
    );
    let info = (await response.json()) as Consulta;

    return info;
  }

  if (capa == "recinto") {
    const recinto = data as DatosConsultaRecinto;
    const {
      provincia,
      agregado,
      zona,
      municipio,
      poligono,
      parcela,
      recinto: recintoId,
    } = recinto;
    if (
      provincia == undefined ||
      agregado == undefined ||
      zona == undefined ||
      municipio == undefined ||
      poligono == undefined ||
      parcela == undefined ||
      recintoId == undefined ||
      capa == undefined
    ) {
      throw new Error("Datos incorrectos");
    }
    const options = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    let response = await fetch(
      (configOverride.proxy ? "" : url) +
        `/fega/ServiciosVisorSigpac/LayerInfo/${capa}/${provincia},${municipio},${agregado},${zona},${poligono},${parcela},${recintoId}`,
      options
    );
    let info = (await response.json()) as Consulta;

    return info;
  }

  if (capa == "infodeclaracion") {
    const declaracion = data as DatosConsultaDeclaracion;
    const { lng, lat } = declaracion;
    if (lng == undefined || lat == undefined) {
      throw new Error("Datos incorrectos");
    }
    const options = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    let response = await fetch(
      (configOverride.proxy ? "" : url) +
        `/fega/ServiciosVisorSigpac/query/infodeclaracion/${lng}/${lat}`,
      options
    );
    let info = (await response.json()) as Consulta;
    return info;
  }

  throw new Error("Nombre de la capa incorrecta");
}

export default {
  localizacion,
  buscar,
  consulta,
};

export { localizacion, buscar, consulta };
