export type ConfigUser = {
   transformCoords: boolean,
   projection: string,
   proxy: boolean
}

export type Geojson = {
   type:     string;
   crs:      CRS;
   features: Feature[];
}

export type CRS = {
   type:       string;
   properties: CRSProperties;
}

export type CRSProperties = {
   code: number;
}

export type Feature = {
   type:       FeatureType;
   id:         number;
   geometry:   Geometry;
   properties: FeatureProperties;
}

export type Geometry = {
   type:        GeometryType;
   coordinates: Array<Array<number[]>>;
}

export enum GeometryType {
   Polygon = "Polygon",
}

export type FeatureProperties = {
   dn_surface: number;
   provincia:  number;
   municipio:  number;
   poligono:   number;
   agregado:   number;
   parcela:    number;
   zona:       number;
}

export enum FeatureType {
   Feature = "Feature",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
   public static toGeojson(json: string): Geojson {
       return cast(JSON.parse(json), r("Geojson"));
   }

   public static geojsonToJson(value: Geojson): string {
       return JSON.stringify(uncast(value, r("Geojson")), null, 2);
   }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
   const prettyTyp = prettyTypeName(typ);
   const parentText = parent ? ` on ${parent}` : '';
   const keyText = key ? ` for key "${key}"` : '';
   throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
   if (Array.isArray(typ)) {
       if (typ.length === 2 && typ[0] === undefined) {
           return `an optional ${prettyTypeName(typ[1])}`;
       } else {
           return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
       }
   } else if (typeof typ === "object" && typ.literal !== undefined) {
       return typ.literal;
   } else {
       return typeof typ;
   }
}

function jsonToJSProps(typ: any): any {
   if (typ.jsonToJS === undefined) {
       const map: any = {};
       typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
       typ.jsonToJS = map;
   }
   return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
   if (typ.jsToJSON === undefined) {
       const map: any = {};
       typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
       typ.jsToJSON = map;
   }
   return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
   function transformPrimitive(typ: string, val: any): any {
       if (typeof typ === typeof val) return val;
       return invalidValue(typ, val, key, parent);
   }

   function transformUnion(typs: any[], val: any): any {
       // val must validate against one typ in typs
       const l = typs.length;
       for (let i = 0; i < l; i++) {
           const typ = typs[i];
           try {
               return transform(val, typ, getProps);
           } catch (_) {}
       }
       return invalidValue(typs, val, key, parent);
   }

   function transformEnum(cases: string[], val: any): any {
       if (cases.indexOf(val) !== -1) return val;
       return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
   }

   function transformArray(typ: any, val: any): any {
       // val must be an array with no invalid elements
       if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
       return val.map(el => transform(el, typ, getProps));
   }

   function transformDate(val: any): any {
       if (val === null) {
           return null;
       }
       const d = new Date(val);
       if (isNaN(d.valueOf())) {
           return invalidValue(l("Date"), val, key, parent);
       }
       return d;
   }

   function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
       if (val === null || typeof val !== "object" || Array.isArray(val)) {
           return invalidValue(l(ref || "object"), val, key, parent);
       }
       const result: any = {};
       Object.getOwnPropertyNames(props).forEach(key => {
           const prop = props[key];
           const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
           result[prop.key] = transform(v, prop.typ, getProps, key, ref);
       });
       Object.getOwnPropertyNames(val).forEach(key => {
           if (!Object.prototype.hasOwnProperty.call(props, key)) {
               result[key] = transform(val[key], additional, getProps, key, ref);
           }
       });
       return result;
   }

   if (typ === "any") return val;
   if (typ === null) {
       if (val === null) return val;
       return invalidValue(typ, val, key, parent);
   }
   if (typ === false) return invalidValue(typ, val, key, parent);
   let ref: any = undefined;
   while (typeof typ === "object" && typ.ref !== undefined) {
       ref = typ.ref;
       typ = typeMap[typ.ref];
   }
   if (Array.isArray(typ)) return transformEnum(typ, val);
   if (typeof typ === "object") {
       return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
           : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
           : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
           : invalidValue(typ, val, key, parent);
   }
   // Numbers can be parsed by Date but shouldn't be.
   if (typ === Date && typeof val !== "number") return transformDate(val);
   return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
   return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
   return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
   return { literal: typ };
}

function a(typ: any) {
   return { arrayItems: typ };
}

function u(...typs: any[]) {
   return { unionMembers: typs };
}

function o(props: any[], additional: any) {
   return { props, additional };
}

function m(additional: any) {
   return { props: [], additional };
}

function r(name: string) {
   return { ref: name };
}

const typeMap: any = {
   "Geojson": o([
       { json: "type", js: "type", typ: "" },
       { json: "crs", js: "crs", typ: r("CRS") },
       { json: "features", js: "features", typ: a(r("Feature")) },
   ], false),
   "CRS": o([
       { json: "type", js: "type", typ: "" },
       { json: "properties", js: "properties", typ: r("CRSProperties") },
   ], false),
   "CRSProperties": o([
       { json: "code", js: "code", typ: 0 },
   ], false),
   "Feature": o([
       { json: "type", js: "type", typ: r("FeatureType") },
       { json: "id", js: "id", typ: 0 },
       { json: "geometry", js: "geometry", typ: r("Geometry") },
       { json: "properties", js: "properties", typ: r("FeatureProperties") },
   ], false),
   "Geometry": o([
       { json: "type", js: "type", typ: r("GeometryType") },
       { json: "coordinates", js: "coordinates", typ: a(a(a(3.14))) },
   ], false),
   "FeatureProperties": o([
       { json: "dn_surface", js: "dn_surface", typ: 3.14 },
       { json: "provincia", js: "provincia", typ: 0 },
       { json: "municipio", js: "municipio", typ: 0 },
       { json: "poligono", js: "poligono", typ: 0 },
       { json: "agregado", js: "agregado", typ: 0 },
       { json: "parcela", js: "parcela", typ: 0 },
       { json: "zona", js: "zona", typ: 0 },
   ], false),
   "GeometryType": [
       "Polygon",
   ],
   "FeatureType": [
       "Feature",
   ],
};

export type Consulta = {
   id:           string[];
   isRecin:      boolean;
   vigencia:     string;
   query:        Query[];
   parcelaInfo:  ParcelaInfo;
   convergencia: Convergencia;
   vuelo:        Vuelo;
   arboles:      any[];
   usos:         Uso[];
}

export type Convergencia = {
   cat_fechaultimaconv: Date;
}

export type ParcelaInfo = {
   provincia:      string;
   municipio:      string;
   agregado:       number;
   zona:           number;
   poligono:       number;
   parcela:        number;
   dn_surface:     number;
   referencia_cat: string;
}

export type Query = {
   recinto:              number;
   dn_surface:           number;
   pendiente_media:      number;
   uso_sigpac:           string;
   admisibilidad:        null;
   superficie_admisible: null;
   coef_regadio:         number | null;
   incidencias:          null | string;
   region:               null | string;
   inctexto:             string[] | null;
}

export type Uso = {
   uso_sigpac:           string;
   dn_surface:           number;
   superficie_admisible: null;
}

export type Vuelo = {
   fecha_vuelo: number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
   public static toConsulta(json: string): Consulta {
       return cast(JSON.parse(json), r("Consulta"));
   }

   public static consultaToJson(value: Consulta): string {
       return JSON.stringify(uncast(value, r("Consulta")), null, 2);
   }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
   const prettyTyp = prettyTypeName(typ);
   const parentText = parent ? ` on ${parent}` : '';
   const keyText = key ? ` for key "${key}"` : '';
   throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
   if (Array.isArray(typ)) {
       if (typ.length === 2 && typ[0] === undefined) {
           return `an optional ${prettyTypeName(typ[1])}`;
       } else {
           return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
       }
   } else if (typeof typ === "object" && typ.literal !== undefined) {
       return typ.literal;
   } else {
       return typeof typ;
   }
}

function jsonToJSProps(typ: any): any {
   if (typ.jsonToJS === undefined) {
       const map: any = {};
       typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
       typ.jsonToJS = map;
   }
   return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
   if (typ.jsToJSON === undefined) {
       const map: any = {};
       typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
       typ.jsToJSON = map;
   }
   return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
   function transformPrimitive(typ: string, val: any): any {
       if (typeof typ === typeof val) return val;
       return invalidValue(typ, val, key, parent);
   }

   function transformUnion(typs: any[], val: any): any {
       // val must validate against one typ in typs
       const l = typs.length;
       for (let i = 0; i < l; i++) {
           const typ = typs[i];
           try {
               return transform(val, typ, getProps);
           } catch (_) {}
       }
       return invalidValue(typs, val, key, parent);
   }

   function transformEnum(cases: string[], val: any): any {
       if (cases.indexOf(val) !== -1) return val;
       return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
   }

   function transformArray(typ: any, val: any): any {
       // val must be an array with no invalid elements
       if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
       return val.map(el => transform(el, typ, getProps));
   }

   function transformDate(val: any): any {
       if (val === null) {
           return null;
       }
       const d = new Date(val);
       if (isNaN(d.valueOf())) {
           return invalidValue(l("Date"), val, key, parent);
       }
       return d;
   }

   function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
       if (val === null || typeof val !== "object" || Array.isArray(val)) {
           return invalidValue(l(ref || "object"), val, key, parent);
       }
       const result: any = {};
       Object.getOwnPropertyNames(props).forEach(key => {
           const prop = props[key];
           const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
           result[prop.key] = transform(v, prop.typ, getProps, key, ref);
       });
       Object.getOwnPropertyNames(val).forEach(key => {
           if (!Object.prototype.hasOwnProperty.call(props, key)) {
               result[key] = transform(val[key], additional, getProps, key, ref);
           }
       });
       return result;
   }

   if (typ === "any") return val;
   if (typ === null) {
       if (val === null) return val;
       return invalidValue(typ, val, key, parent);
   }
   if (typ === false) return invalidValue(typ, val, key, parent);
   let ref: any = undefined;
   while (typeof typ === "object" && typ.ref !== undefined) {
       ref = typ.ref;
       typ = typeMap[typ.ref];
   }
   if (Array.isArray(typ)) return transformEnum(typ, val);
   if (typeof typ === "object") {
       return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
           : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
           : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
           : invalidValue(typ, val, key, parent);
   }
   // Numbers can be parsed by Date but shouldn't be.
   if (typ === Date && typeof val !== "number") return transformDate(val);
   return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
   return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
   return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
   return { literal: typ };
}

function a(typ: any) {
   return { arrayItems: typ };
}

function u(...typs: any[]) {
   return { unionMembers: typs };
}

function o(props: any[], additional: any) {
   return { props, additional };
}

function m(additional: any) {
   return { props: [], additional };
}

function r(name: string) {
   return { ref: name };
}

const typeMap: any = {
   "Consulta": o([
       { json: "id", js: "id", typ: a("") },
       { json: "isRecin", js: "isRecin", typ: true },
       { json: "vigencia", js: "vigencia", typ: "" },
       { json: "query", js: "query", typ: a(r("Query")) },
       { json: "parcelaInfo", js: "parcelaInfo", typ: r("ParcelaInfo") },
       { json: "convergencia", js: "convergencia", typ: r("Convergencia") },
       { json: "vuelo", js: "vuelo", typ: r("Vuelo") },
       { json: "arboles", js: "arboles", typ: a("any") },
       { json: "usos", js: "usos", typ: a(r("Uso")) },
   ], false),
   "Convergencia": o([
       { json: "cat_fechaultimaconv", js: "cat_fechaultimaconv", typ: Date },
   ], false),
   "ParcelaInfo": o([
       { json: "provincia", js: "provincia", typ: "" },
       { json: "municipio", js: "municipio", typ: "" },
       { json: "agregado", js: "agregado", typ: 0 },
       { json: "zona", js: "zona", typ: 0 },
       { json: "poligono", js: "poligono", typ: 0 },
       { json: "parcela", js: "parcela", typ: 0 },
       { json: "dn_surface", js: "dn_surface", typ: 3.14 },
       { json: "referencia_cat", js: "referencia_cat", typ: "" },
   ], false),
   "Query": o([
       { json: "recinto", js: "recinto", typ: 0 },
       { json: "dn_surface", js: "dn_surface", typ: 3.14 },
       { json: "pendiente_media", js: "pendiente_media", typ: 0 },
       { json: "uso_sigpac", js: "uso_sigpac", typ: "" },
       { json: "admisibilidad", js: "admisibilidad", typ: null },
       { json: "superficie_admisible", js: "superficie_admisible", typ: null },
       { json: "coef_regadio", js: "coef_regadio", typ: u(0, null) },
       { json: "incidencias", js: "incidencias", typ: u(null, "") },
       { json: "region", js: "region", typ: u(null, "") },
       { json: "inctexto", js: "inctexto", typ: u(a(""), null) },
   ], false),
   "Uso": o([
       { json: "uso_sigpac", js: "uso_sigpac", typ: "" },
       { json: "dn_surface", js: "dn_surface", typ: 3.14 },
       { json: "superficie_admisible", js: "superficie_admisible", typ: null },
   ], false),
   "Vuelo": o([
       { json: "fecha_vuelo", js: "fecha_vuelo", typ: 0 },
   ], false),
};
