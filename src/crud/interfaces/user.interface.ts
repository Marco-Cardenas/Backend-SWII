import { Document } from "mongoose";

export interface User extends Document {
  name: string;
  email: string;
  password: string;
  profile: string;
  description: string;
  favorites: string[];
  historial: string[];
}