import { Schema } from "mongoose";

export const DenunciaSchema = new Schema({
  razon: {type:String, default:''},
  observacion: {type:String, default:''},
  idComentario: {type:String, default:''},
  idDenunciado: {type:String, default:''},
  idDenunciante: {type:String, default:''},
  idAdministrador: {type:String, default:''},
  tipo: {type:String, default:'EN PROCESO'},
  fecha: {type:Date, default: Date.now() },
  tiempoBaneo: {type: Number, default: 0}
});