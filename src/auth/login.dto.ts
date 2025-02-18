import { IsEmail, IsString, IsObject, IsNotEmpty, IsOptional } from "class-validator";

export class loginDto {
    @IsObject()
    @IsOptional()
    _id:object;

    @IsEmail()
    @IsNotEmpty()
    email:string;

    @IsString()
    @IsNotEmpty()
    password:string
  }