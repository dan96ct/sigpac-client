const proj4 = require("proj4");

/**
 * Devuelve el mismo geojson con las coordenadas cambiadas a la proyección pasada como parametro
 * @param {Object} geojson Objeto con las coordenadas de las parcelas
 * @param {String} projection Proyección final a la que se van a transformar las coordenadas
 * @returns {Object} Objeto con las coordenadas de las parcelas cambiadas
 */
const transformCoords = (geojson, projection) => {
    const result = {
        ...geojson,
        features: geojson.features.map((feature) => {
            return {
                ...feature,
                geometry: {
                    ...feature.geometry,
                    coordinates: feature.geometry.coordinates.map(subpolygon => subpolygon.map(pair => {
                        const firstProjection = 'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
                        const secondProjection = proj4.defs(projection);
                        return proj4(firstProjection, secondProjection, pair);
                    }))
                }
            }
        })
    }
    return result;
}
module.exports = transformCoords;
