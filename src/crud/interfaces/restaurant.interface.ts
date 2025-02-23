import { Document } from "mongoose";

export interface reviewObject {
  idUser: string;
  comment: string;
  calification: number;
  responses: reviewObject[];
}


export interface Restaurant extends Document {
  name: string;
  own: string;
  fotoPerfil: string;
  description: string;
  address: {
    latitude: number;
    longitude: number;
  };
  viewed: number;
  reviews: reviewObject[];
}