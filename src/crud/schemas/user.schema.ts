import { Schema } from "mongoose";
import { preguntasObject } from "../interfaces/user.interface";

export const UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  fotoPerfil: { type: String, default: '' },
  description: { type: String, default: '' },
  favorites: { type: Array<String>, default: []},
  historial: { type: Array<String>, default: [] },
  typo: {type: String, default: 'user'},
  preguntasDeSeguridad: {type:Array<preguntasObject>, default: []}
});