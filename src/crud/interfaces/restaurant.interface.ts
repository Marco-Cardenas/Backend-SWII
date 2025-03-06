import { Document } from "mongoose";

export interface reviewObject {
  _id:string;
  idUser: string;
  userName:string;
  comment: string;
  calification: number;
  date:Date;
  responses: reviewObject[];
}


export interface Restaurant extends Document {
  name: string;
  own: string;
  fotoPerfil: string;
  description: string;
  etiquetas: string[];
  latitude: number;
  longitude: number;
  address: string;
  viewed: number;
  reviews: reviewObject[];
}