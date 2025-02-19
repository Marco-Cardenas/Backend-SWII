import { Schema } from "mongoose";

export const RestaurantSchema = new Schema({
  name: {type:String, default: ''},
  own: {type: String, default: ''},
  fotoPerfil: {type:String, default: ''},
  description: {type:String, default: ''},
  address: {type:Object, default: {}},
  viewed: {type:Number, default: 0},
  reviews: {type:Array<Object>, default: []}
});