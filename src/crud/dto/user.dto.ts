import { IsEmail, IsString, IsNotEmpty, IsOptional, IsArray } from "class-validator";

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  profile: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsArray()
  @IsOptional()
  favorites: string[];

  @IsString()
  @IsArray()
  @IsOptional()
  historial: string[];
}