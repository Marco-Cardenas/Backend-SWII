import { Document } from "mongoose";

export interface Escaneo extends Document {
  foto: string;
  latitud: string;
  longitud: string;
  anguloCamara: string;
  fecha: Date;
  idUser: string;
  restaurantesCercanos: string[];
}