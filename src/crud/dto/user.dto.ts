import { ApiProperty } from '@nestjs/swagger';
import { preguntasObject } from '../interfaces/user.interface';

export class CreateUserDTO {
  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User password' })
  password: string;

  @ApiProperty({ description: 'User profile picture URL' })
  fotoPerfil: string;

  @ApiProperty({ description: 'User description' })
  description: string;

  @ApiProperty({ description: 'User favorite items' })
  favorites: string[];

  @ApiProperty({ description: 'User history' })
  historial: string[];

  @ApiProperty({ description: 'User type' })
  typo: string;

  @ApiProperty({ description: 'User questions' })
  preguntasDeSeguridad: preguntasObject[];

  @ApiProperty({ description: 'User state in BD ----- FRONT NO USA ESTA VARIABLE' })
  deshabilitarDatos: boolean;
}