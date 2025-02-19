import { reviewObject } from "../interfaces/restaurant.interface";

export class CreateRestaurantDTO {
  name: string;
  own: string;
  fotoPerfil: string;
  description: string;
  address: {};
  viewed: number;
  reviews: reviewObject[];
}