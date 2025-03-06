import { ApiProperty } from '@nestjs/swagger';
import { reviewObject } from "../interfaces/restaurant.interface";


export class CreateRestaurantDTO {
  @ApiProperty({ description: 'Restaurant name' })
  name: string;

  @ApiProperty({ description: 'Restaurant owner' })
  own: string;

  @ApiProperty({ description: 'Restaurant profile picture URL' })
  fotoPerfil: string;

  @ApiProperty({ description: 'Restaurant description' })
  description: string;

  @ApiProperty({ description: 'Etiquetas del restaurante' })
  etiquetas: string[];

  @ApiProperty({ description: 'Restaurant address' })
  address: string;
  
  @ApiProperty({ description: 'Restaurant latitude' })
  latitude: number;

  @ApiProperty({ description: 'Restaurant longitude' })
  longitude: number;

  @ApiProperty({ description: 'Number of times the restaurant has been viewed' })
  viewed: number;

  @ApiProperty({ description: 'Restaurant reviews' })
  reviews: reviewObject[];
}