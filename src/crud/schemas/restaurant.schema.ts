import { Schema, Types } from "mongoose";
import { reviewObject } from "../interfaces/restaurant.interface";

// Esquema del restaurante
export const RestaurantSchema = new Schema({
  name: { type: String, default: '' },
  rif: { type: String, default: '' },
  own: { type: String, default: '' },
  fotoPerfil: { type: String, default: '' },
  description: { type: String, default: '' },
  etiquetas: {type: Array<String>, default:[]},
  address: { type: String, default: '' },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  viewed: { type: Number, default: 0 },
  reviews: { type: Array<reviewObject>, default: [] }, // Usa el subesquema
  fotos: { type: Array<String>, default: []},
  deshabilitarDatos: { type:Boolean, default:false },
  tiempoBaneo: {type: Date, default:0 }
});