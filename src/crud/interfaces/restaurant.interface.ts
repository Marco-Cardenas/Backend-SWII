import { Document } from "mongoose";

export interface reviewObject {
  idUser: string;
  userName:string;
  comment: string;
  calification: number;
  responses: reviewObject[];
}


export interface Restaurant extends Document {
  name: string;
  own: string;
  fotoPerfil: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  viewed: number;
  reviews: reviewObject[];
}