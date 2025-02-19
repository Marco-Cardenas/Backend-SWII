import { Schema } from "mongoose";

export const UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  fotoPerfil: { type: String, default: '' },
  description: { type: String, default: '' },
  favorites: { type: Array<String>, default: []},
  historial: { type: Array<String>, default: [] },
  typo: {type: String, default: 'user'}
});