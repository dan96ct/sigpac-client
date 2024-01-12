const chai = require('chai');

const Sigpac = require('../dist/index');

describe('Suite de pruebas Sigpac', () => {
     it('Deberia devolver un objeto con los resultados del filtro', (done) => {
          const data = {
               comunidad: 7,
               provincia: 2,
               municipio: 79,
               poligono: 37,
               parcela: 22
          };
          
          Sigpac.buscar(data)
                  .then((json) => {
                         if(typeof(json) == 'object'){
                              done();
                         }else{
                              done('Respuesta inesperada de la api');
                         }
                   })
                   .catch((err) => {
                         done(err);
                   });
     });

     it('Deberia devolver un objeto con un geojson de las coordenadas', (done) => {
          const data = {
               lng: -1.8054282, 
               lat: 38.9598049
          }
          Sigpac.localizacion('parcela', data)
                  .then((json) => {
                         if(typeof(json) == 'object'){
                              done();
                         }else{
                              done('Respuesta inesperada de la api');
                         }
                   })
                   .catch((err) => {
                         done(err);
                   });
     })

     it('Deberia devolver un objeto con con informacion de una parcela', (done) => {
          const data = {
               provincia: 2,
               agregado: 0,
               zona: 0,
               municipio: 79,
               poligono: 37,
               parcela: 22
          };
          Sigpac.consulta('parcela', data)
               .then((json) => {
                         
                         if(typeof(json) == 'object'){
                              done();
                         }else{
                              done('Respuesta inesperada de la api');
                         }
               })
               .catch((err) => {
                         done(err);
               });
     });

     it('Deberia devolver un objeto con con informacion de un recinto', (done) => {
          const data = {
               provincia: 2,
               agregado: 0,
               zona: 0,
               municipio: 79,
               poligono: 37,
               parcela: 22,
               recinto: 1
          };
          Sigpac.consulta('recinto', data)
               .then((json) => {
                         
                         if(typeof(json) == 'object'){
                              done();
                         }else{
                              done('Respuesta inesperada de la api');
                         }
               })
               .catch((err) => {
                         done(err);
               });
     });

     it('Deberia devolver un objeto con con informacion de una linea de declaración', (done) => {
          const data = {
               lng: -1.8054282, 
               lat: 38.9598049
          };
          Sigpac.consulta('declaracion', data)
               .then((json) => {

                         if(typeof(json) == 'object'){
                              done();
                         }else{
                              done('Respuesta inesperada de la api');
                         }
               })
               .catch((err) => {
                         done(err);
               });
     });
});