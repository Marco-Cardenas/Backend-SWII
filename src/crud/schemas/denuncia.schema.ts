import { Schema } from "mongoose";

export const DenunciaSchema = new Schema({
  observacion: {type:String, default:''},
  idComentario: {type:String, default:''},
  idDenunciado: {type:String, default:''},
  idDenunciante: {type:String, default:''},
  idAdministrador: {type:String, default:''},
  tipo: {type:String, default:''},
  fecha: {type:Date, default: Date.now() }
});