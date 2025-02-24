import { Schema } from "mongoose";
import { reviewObject } from "../interfaces/restaurant.interface";

export const RestaurantSchema = new Schema({
  name: {type:String, default: ''},
  own: {type: String, default: ''},
  fotoPerfil: {type:String, default: ''},
  description: {type:String, default: ''},
  address: {type:Object, default: {}},
  viewed: {type:Number, default: 0},
  reviews: {type:Array<reviewObject>, default: []}
});