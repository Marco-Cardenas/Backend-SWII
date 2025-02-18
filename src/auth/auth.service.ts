import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CrudService } from '../crud/crud.service';
import { CreateUserDTO } from '../crud/dto/user.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => CrudService))
    private readonly crudService: CrudService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.crudService.getUserByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async loginFromMongoose(user: any) {
    const userDoc = user._doc; 
    const { email, _id } = userDoc;
    const payload = { email, sub: _id };
  
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id.toString() };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userDTO: CreateUserDTO,response:Response) {
    const user = await this.crudService.createUser(userDTO,response);
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}