import { Document } from "mongoose";

export interface User extends Document {
  name: string;
  email: string;
  password: string;
  fotoPerfil: string;
  description: string;
  favorites: string[];
  historial: string[];
  typo: string;
}