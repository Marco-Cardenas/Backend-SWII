import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './interfaces/user.interface';
import { CreateUserDTO } from './dto/user.dto';
import { Restaurant } from './interfaces/restaurant.interface';
import { CreateRestaurantDTO } from './dto/restaurant.dto';
import * as bcrypt from 'bcrypt';
import { Escaneo } from './interfaces/escaneo.interface';
import { Denuncia } from './interfaces/denuncia.interface';
import { CreateEscaneoDTO } from './dto/escaneo.dto';
import { CreateDenunciaDTO } from './dto/denuncia.dto';

@Injectable()
export class CrudService {
  constructor(
    @InjectModel('Escaneos') private readonly escaneoModel: Model<Escaneo>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Restaurant') private readonly restaurantModel: Model<Restaurant>,
    @InjectModel('Denuncias') private readonly denunciaModel: Model<Denuncia>
  ) {}

  //Servicios de Escaneos
  async createEscaneo(escaneoDTO: CreateEscaneoDTO): Promise<Escaneo> {
    const newEscaneo = await this.escaneoModel.create(escaneoDTO);
    return await newEscaneo.save();
  }

  async getAllEscaneos(opciones: any): Promise<Escaneo[]> {
    const escaneosFound = await this.escaneoModel.find(opciones);
    return escaneosFound;
  }

  async getEscaneo(escaneoID: string): Promise<Escaneo> {
    const escaneo = await this.escaneoModel.findById(escaneoID);
    return escaneo;
  }

  async updateEscaneo(escaneoID: string, escaneoData: any): Promise<Escaneo> {
    //el valor {new:true} se usa para retornar el escaneo despues de actualizarla
    const escaneoUpdated = await this.escaneoModel.findByIdAndUpdate(escaneoID, escaneoData, {new:true});
    return escaneoUpdated;
  }

  async deleteEscaneo(escaneoID: string): Promise<Escaneo> {
    //el valor {new:false} se usa para retornar el escaneo antes de ser borrada
    const escaneoDeleted = await this.escaneoModel.findByIdAndDelete(escaneoID, {new:false});
    return escaneoDeleted;
  }


  //Serivicios para usuarios
  async createUser(userDTO: CreateUserDTO): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(userDTO.password, salt);
    const newUser = new this.userModel({
      ...userDTO,
      password: hashedPassword,
    });
    return await newUser.save();
  }

  async getAllUsers(opciones: any): Promise<User[]> {
    const usersFound = await this.userModel.find(opciones);
    return usersFound;
  }

  async getUser(userID: string): Promise<User> {
    const user = await this.userModel.findById(userID);
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email });
    return user;
  }

  async updateUser(userID: string, userData: any): Promise<User> {
    //el valor {new:true} se usa para retornar el usuario despues de actualizarlo
    const userUpdated = await this.userModel.findByIdAndUpdate(userID, userData, {new:true});
    return userUpdated;
  }

  async deleteUser(userID: string): Promise<User> {
    //el valor {new:false} se usa para retornar el usuario antes de ser borrado
    const userDeleted = await this.userModel.findByIdAndDelete(userID, {new:false});
    return userDeleted;
  }

  async getRestaurantsLiked(userID: string): Promise<Restaurant[]> {
    // Populate the 'favorites' field with Restaurant documents
    const user = await this.userModel.findById(userID).populate('favorites');
    
    // Assert that the populated 'favorites' field is of type Restaurant[]
    return user.favorites as unknown as Restaurant[];
}
  //Servicios para restaurantes
  async createRestaurant(restaurantDTO: CreateRestaurantDTO): Promise<Restaurant> {
    const newRestaurant = await this.restaurantModel.create(restaurantDTO);
    return await newRestaurant.save();
  }

  async getAllRestaurants(opciones: any): Promise<Restaurant[]> {
    const restaurantsFound = await this.restaurantModel.find(opciones);
    return restaurantsFound;
  }

  async getRestaurant(restaurantID: string): Promise<Restaurant> {
    const restaurant = await this.restaurantModel.findById(restaurantID);
    return restaurant;
  }

  async updateRestaurant(restaurantID: string, restaurantData: any): Promise<Restaurant> {
    //el valor {new:true} se usa para retornar la tienda despues de actualizarla
    const restaurantUpdated = await this.restaurantModel.findByIdAndUpdate(restaurantID, restaurantData, {new:true});
    return restaurantUpdated;
  }

  async deleteRestaurant(restaurantID: string): Promise<Restaurant> {
    //el valor {new:false} se usa para retornar la tienda antes de ser borrada
    const restaurantDeleted = await this.restaurantModel.findByIdAndDelete(restaurantID, {new:false});
    return restaurantDeleted;
  }


  //Servicios de Denuncias
  async createDenuncia(denunciaDTO: CreateDenunciaDTO): Promise<Denuncia> {
    const newDenuncia = await this.denunciaModel.create(denunciaDTO);
    return await newDenuncia.save();
  }

  async getAllDenuncias(opciones: any): Promise<Denuncia[]> {
    const denunciasFound = await this.denunciaModel.find(opciones);
    return denunciasFound;
  }

  async getDenuncia(denunciaID: string): Promise<Denuncia> {
    const denuncia = await this.denunciaModel.findById(denunciaID);
    return denuncia;
  }

  async updateDenuncia(denunciaID: string, denunciaData: any): Promise<Denuncia> {
    //el valor {new:true} se usa para retornar la denuncia despues de actualizarla
    const denunciaUpdated = await this.denunciaModel.findByIdAndUpdate(denunciaID, denunciaData, {new:true});
    return denunciaUpdated;
  }

  async deleteDenuncia(denunciaID: string): Promise<Denuncia> {
    //el valor {new:false} se usa para retornar la denuncia antes de ser borrada
    const denunciaDeleted = await this.denunciaModel.findByIdAndDelete(denunciaID, {new:false});
    return denunciaDeleted;
  }
}
