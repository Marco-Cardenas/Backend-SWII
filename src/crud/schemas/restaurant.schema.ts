import { Schema, Types } from "mongoose";

// Esquema para cada review (subdocumento)
export const ReviewSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true }, // Genera _id automático
  idUser: { type: String, required: true },
  userName:{type:String,default:""},
  comment: { type: String, default: "" },
  calification: { type: Number, default: 0 },
  date:{type:Date,default:""}
}, { _id: true }); // Asegura que se genere el _id

// Esquema del restaurante
export const RestaurantSchema = new Schema({
  name: { type: String, default: '' },
  own: { type: String, default: '' },
  fotoPerfil: { type: String, default: '' },
  description: { type: String, default: '' },
  etiquetas: {type: Array<String>, default:[]},
  address: { type: String, default: '' },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  viewed: { type: Number, default: 0 },
  reviews: { type: [ReviewSchema], default: [] }, // Usa el subesquema
});