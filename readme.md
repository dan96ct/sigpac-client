<div id="top"></div>


<br />
<div align="center">
  <h3 align="center">Sigpac Client</h3>

  <p align="center">
    Cliente API sigpac para Javascript
    <br />
    <br />
    <!--<a href="">Ver Demo</a>-->
    <a href="https://github.com/dan96ct/sigpac-client/issues">Reportar Bug</a>
  </p>
</div>




<details>
  <summary>Tabla de contenido</summary>
  <ol>
    <li>
      <a href="#sobre-el-proyecto">Sobre el proyecto</a>
    <li>
      <a href="#instalacion">Instalación</a>
      <ul>
        <li><a href="#ejemplo-de-uso">Ejemplo de uso</a></li>
      </ul>
    </li>
    <li><a href="#funciones">Funciones</a>
      <ul>
          <li>
            <a href="#localizacion">localizacion</a>
          </li>
          <li>
            <a href="#buscar">buscar</a>
          </li>
          <li>
            <a href="#consulta">consulta</a>
          </li>
      </ul>
    </li>
    <li><a href="#librerias-usadas">Librerias usadas</a></li>
    <li><a href="#contacto">Contacto</a></li>
  </ol>
</details>




## Sobre el proyecto
El objetivo de esta libreria es usar la api de sigpac desde cualquier framework de javascript de forma sencilla para poder consultar los datos en tiempo real.
Basicamente se ha tratado de extrapolar el funcionamiento de la <a href="https://sigpac.mapama.gob.es/fega/visor/">página oficial</a> a una libreria sencilla de utilizar.

Probada en:

[![Nodejs]][Nodejs-url]
[![React.js]][React-url]






## Instalación

Puede instalar la libreria mediante npm

 ```sh
  npm i sigpac-client
  ```

### Ejemplo de uso
```js
import Sigpac from 'sigpac-client';

Sigpac.localizacion(capa, {lng: -1.8054282, lat: 38.9598049})
      .then((geojson) => {
          //Tu código
      });
```
Mediante importación de funciones individuales
```js
import { localizacion } from 'sigpac-client';

localizacion(capa, {lng: -1.8054282, lat: 38.9598049})
.then((geojson) => {
     //Tu código
});
```

Forma sincrona
```js

import { localizacion } from 'sigpac-client';

let geojson = await localizacion(capa, {lng: -1.8054282, lat: 38.9598049});

```

## Funciones
Se han intentado replicar exactamente las mismas funciones respetando sus nombres para evitar confusiones, asi como sus parametros.
Por ejemplo la opción <b>consulta</b> equivale a la función <a href="#consulta">consulta</a>.
### localizacion
Devuelve un geojson con los datos de las coordenadas.

|  Parametros                 | Tipo | Valores permitidos   | Ejemplo | Obligatorio
| :------------------------ | :-------------: |:-------------:| :-------------:| :-------------:|
| capa 	       | String |parcela, recinto, declaracion, red_natura, montanera, nitratos, fitosanitarios, pastos_permanentes, e_paisaje_linea, sie, mfe, cp_no_integradas | `'parcela'` | Si
| coords          | Object | lat, lng | `{ lng: -1.8054282, lat: 38.9598049 }` | Si
| config          | Object | transformCoords, projection, proxy | ` { transformCoords: true, projection: 'WGS84', proxy: false }` | No

Ejemplo
```js
import { localizacion } from 'sigpac-client';

const coords = {lng: -1.8054282, lat: 38.9598049};

localizacion(capa, coords)
.then((geojson) => {
     //Tu código
});
```

Sigpac utiliza un sistema de coordenadas distinto al que se suele usar en google maps o cualquier mapa web, por tanto se ha necesitado transformar las coordenadas antes de devolver el geojson. La proyección por defecto es WGS84 (mas info <a href="https://es.wikipedia.org/wiki/WGS84#:~:text=El%20WGS%2084%20(World%20Geodetic,x%2Cy%2Cz).">aquí</a>) sin embargo esta se puede cambiar o directamente anular.

```js
import { localizacion } from 'sigpac-client';

const coords = {lng: -1.8054282, lat: 38.9598049};

//Anular transformación de coordenadas
const config = {transformCoords:  false}

localizacion(capa, coords, config)
.then((geojson) => {
     //Tu código
});
```
```js
import { localizacion } from 'sigpac-client';

const coords = {lng: -1.8054282, lat: 38.9598049};

//Cambiar proyección
const config = {projection: 'EPSG:4326'}

localizacion(capa, coords, config)
.then((geojson) => {
     //Tu código
});

```

La manipulación de las coordenadas se ha realizado gracias a la libreria <a href="http://proj4js.org/"><b>proj4js</b></a>.
Más información sobre el nombre de las proyecciones <a href="http://proj4js.org/#named-projections">aquí</a>.


### buscar
Devuelve un json con la información de forma recursiva a los valores enviados, es decir si se envia como valores la comunidad y la provincia devolverá los municipios. Esta función esta pensada para filtros por tanto lo ideal es hacer peticiones recursivas en el siguiente orden comunidad -> provincia -> municipio -> poligono -> parcela

|  Parametros                 | Tipo | Valores permitidos   | Ejemplo | Obligatorio
| :------------------------ | :-------------: |:-------------:| :-------------:| :-------------:|
| data          | Object | comunidad, provincia, municipio, poligono, parcela | `{ comunidad: 7, provincia: 2, municipio: 79, poligono: 37, parcela: 22 }` | Si
| config          | Object |proxy | ` { proxy: false }` | No

Ejemplo
```js
import { buscar } from 'sigpac-client';

let data = { comunidad: 7 };

let provincias = await Sigpac.buscar(data);
data.provincia =  provincias.features[0].properties.codigo;

let municipios = await Sigpac.buscar(data);
data.municipio =  municipios.features[0].properties.codigo;

let poligonos = await Sigpac.buscar(data);
data.poligono =  poligonos.features[0].properties.codigo;
let parcelas = await Sigpac.buscar(data);

data.parcela =  parcelas.features[0].properties.codigo;
let recintos = await Sigpac.buscar(data);
console.log(recintos.features[0].properties)
/**
  {
    dn_pk: '1222533953',
    nombre: 1,
    codigo: 1,
    x1: -1.605634135436811,
    y1: 39.22648224243416,
    x2: -1.6020442700300674,
    y2: 39.22740772865163
  }
 */
```
El número de las comunidades coinciden con los orginales, los cuales son:
Comunidad                 | Número
:------------------------ | :-------------:
 ANDALUCIA | 1
ARAGÓN | 2
ASTURIAS | 3
C. VALENCIANA | 17
CANARIAS | 5
CANTABRIA | 6
CASTILLA-LA MANCHA | 7
CASTILLA Y LEÓN | 8
CATALUÑA | 9
EXTREMADURA | 10
GALICIA | 11
ILLES BALEARS | 4
LA RIOJA | 16
MADRID | 12
MURCIA | 13
NAVARRA | 14
PAIS VASCO | 15

### consulta
Devuelve un json con los datos de la capa (parcela, recinto o declaración).
Dependiendo de la capa que se elija es necesario unos parametros u otros.

|  Parametros                 | Tipo | Valores permitidos   | Ejemplo | Obligatorio
| :------------------------ | :-------------: |:-------------:| :-------------:| :-------------:|
| capa 	       | String | parcela, recinto, declaracion | `'parcela'` | Si
| data          | Object | <b>parcela:</b> { provincia, agregado, zona, municipio, poligono, parcela }<br /><b>recinto</b>: { provincia, agregado, zona, municipio, poligono, parcela, recinto }<br /><b>declaracion:</b> { lng, lat } | `{ provincia: 2, agregado: 0, zona: 0, municipio: 79, poligono: 37, parcela: 22, recinto: 1 }` | Si
| config          | Object | proxy | ` { proxy: false }` | No

Ejemplo
```js
import { consulta } from 'sigpac-client';

const data = {
               provincia: 2,
               agregado: 0,
               zona: 0,
               municipio: 79,
               poligono: 37,
               parcela: 22,
               recinto: 1
             };

consulta('recinto', data)
.then((json) => {
  //Tu código  
});
```
```js
import { consulta } from 'sigpac-client';

const data = {
               lng: -1.8054282, 
               lat: 38.9598049
             };

consulta('declaracion', data)
.then((json) => {
  //Tu código  
});
```


## Librerias usadas

* [global-mercator](https://github.com/DenisCarriere/global-mercator)
* [node-fetch](https://github.com/node-fetch/node-fetch)
* [proj4](http://proj4js.org/)
* [chai](https://www.chaijs.com/)
* [mocha](https://mochajs.org/)




## Contacto
Por favor, pongase en contacto conmigo para cualquier problema, duda o sugerencia.

Daniel Cebrián - d.cebrian9@gmail.com

[Nodejs]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=nodedotjs&logoColor=green
[Nodejs-url]: https://nodejs.org/es/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/