import { Document } from "mongoose";

export interface Denuncia extends Document {
  observacion: string;
  idComentario: string;
  idDenunciado: string;
  idDenunciante: string;
  idAdministrador: string;
  tipo: string;
  fecha: Date;
}