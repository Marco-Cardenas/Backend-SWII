import { Schema } from "mongoose";

export const EscaneoSchema = new Schema({
  foto: {type: String, default:''},
  latitud: {type: String, default:''},
  longitud: {type: String, default:''},
  anguloCamara: {type: String, default:''},
  fecha: {type: Date, default:Date.now()},
  idUser: {type: String, default:''},
  restaurantesCercanos: {type: Array<String>, default:[]}
});