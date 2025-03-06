import { Injectable,Res } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { User } from './interfaces/user.interface';
import { CreateUserDTO } from './dto/user.dto';
import { Restaurant, reviewObject } from './interfaces/restaurant.interface';
import { CreateRestaurantDTO } from './dto/restaurant.dto';
import * as bcrypt from 'bcrypt';
import { Escaneo } from './interfaces/escaneo.interface';
import { Denuncia } from './interfaces/denuncia.interface';
import { CreateEscaneoDTO } from './dto/escaneo.dto';
import { CreateDenunciaDTO } from './dto/denuncia.dto';
import { updateCommentDto } from './dto/update-comment.dto';
import { Response } from 'express';

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


  async getNearbyRestaurants(latitud: number, longitud: number, anguloCamara: number, distanciaRequerida: number) {
    // Conversión de grados a radianes
    const convertRadians = (coordinates: number) => coordinates * Math.PI / 180;
      
    // Radio de la tierra en kilómetros
    const earthRadius = 6371; 

    // Convertimos la distancia requerida de metros a kilómetros
    const distanceMeter = distanciaRequerida / 1000;

    // Recopilamos todos los restaurantes
    const allRestaurants = await this.restaurantModel.find({});

    // Seleccionamos los restaurantes que estén a una distancia menor o igual a la distancia requerida
    const escaneosNear = allRestaurants.map(restaurant => {
          // Latitud y longitud en radianes
          const lat = convertRadians(latitud);
          const lon = convertRadians(longitud);
          const lat1Rad = convertRadians(restaurant.latitude);
          const lon1Rad = convertRadians(restaurant.longitude);
                
          // Diferencia de latitud y longitud
          const differenceLat = lat - lat1Rad;
          const differenceLon = lon - lon1Rad;

          // Fórmula de Haversine
          const a = Math.sin(differenceLat / 2) * Math.sin(differenceLat / 2) + 
                    Math.sin(differenceLon / 2) * Math.sin(differenceLon / 2) * 
                    Math.cos(lat) * Math.cos(lat1Rad);

          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = earthRadius * c;
          /*
            let angulo = Math.atan2(restaurant.longitude - longitud, restaurant.latitude - latitud) * 180 / Math.PI;
            //Se ajusta el angulo para que este entre 0 y 360
            angulo = (angulo + 360) % 360;
            //Se calcula la diferencia entre el angulo de la camara y el angulo del escaneo
            let diferencia = Math.abs(anguloCamara - angulo);
            //Se ajusta la diferencia para que este entre 0 y 180
            diferencia = (diferencia + 180) % 180;
                
            // Retorno si la diferencia es menor o igual a 45 grados y la distancia es menor o igual a la distancia dada
            return diferencia <= 45 && distance <= parseFloat(distanciaRequerida);
          */
          // Retornamos el objeto del restaurante con la distancia calculada
          return { ...restaurant.toObject(), distance };
        })
        .filter(restaurant => restaurant.distance <= distanceMeter); // Filtramos por la distancia requerida

    return escaneosNear;
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
    const email = userDTO.email;
    const emailTaken = await this.userModel.findOne({ email: email });
    if (emailTaken) {
       return null
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(userDTO.password, salt);
    const newUser = new this.userModel({
      ...userDTO,
      password: hashedPassword,
    });
    return await newUser.save();
  }

  async createAdmin(adminDTO: CreateUserDTO): Promise<User> {
    const email = adminDTO.email;
    const emailTaken = await this.userModel.findOne({ email });
    if (emailTaken) return null;
  
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(adminDTO.password, salt);
    
    const newAdmin = new this.userModel({
      ...adminDTO,
      password: hashedPassword,
      typo: 'admin',
    });
  
    return await newAdmin.save();
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
  async updateUserHistorial(userID: string, viewedRestaurant: string):Promise<User> {
    //el valor {new:true} se usa para retornar el usuario despues de actualizarlo
    const historialActualizado = await this.userModel.findByIdAndUpdate(userID, { $push:{ historial:viewedRestaurant } }, {new:true});
    return historialActualizado;
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
  async addRestaurantToFavorites(userId: string, restaurantId: string): Promise<User> {
    try {
      // Buscamos el usuario
      const user = await this.userModel.findById(userId);
      if (!user) {
        return null;
      }

      // Verificamos si el restaurante ya está en favoritos
      if (user.favorites.includes(restaurantId)) {
        throw new Error('El restaurante ya está en la lista de favoritos');
      }

      // Añadimos el restaurantId al array de favorites
      const userUpdated = await this.userModel.findByIdAndUpdate(
        userId,
        { $push: { favorites: restaurantId } },
        { new: true }
      );

      return userUpdated;
    } catch (error) {
      throw error;
    }
  }
  async getRestaurantsLiked(userID: string): Promise<Restaurant[]> {
    const user = await this.userModel.findById(userID);
    if (!user || !user.favorites.length) {
      return [];
    }
    const restaurantsLiked = await this.restaurantModel.find({ _id: { $in: user.favorites } });
    return restaurantsLiked;
  }

  async getRestaurantsShowed(userID: string): Promise<Restaurant[]> {
    const user = await this.userModel.findById(userID);
    if (!user || !user.historial.length) {
      return [];
    }
    const restaurantsShowed = await this.restaurantModel.find({ _id: { $in: user.historial } });
    return restaurantsShowed;
  }

  async deleteRestaurantsFromShowed(userID: string, restaurantIDs: string[]): Promise<{ resultado: string }> {
    await this.userModel.findByIdAndUpdate(
      userID,
      { $pull: { historial: { $in: restaurantIDs } } }
    );
    return { resultado: 'Restaurantes eliminados del historial' };
  }

  async deleteRestaurantFromLiked(userID: string, restaurantIDs: string[]): Promise<{ resultado: string }> {
    await this.userModel.findByIdAndUpdate(
      userID,
      { $pull: { favorites: { $in: restaurantIDs } } }
    );
    return { resultado: 'Restaurantes eliminados de favoritos' };
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

  async addComment(idRestaurant:string, comment:reviewObject, idUser:string):Promise<any>{

    const restaurant = await this.restaurantModel.findById(idRestaurant);
    if(!restaurant){
      return null;
    }
    const user = await this.userModel.findById(idUser);
    comment.idUser = idUser;
    comment.userName = user.name;
    const fechaUTC:Date = new Date();
    const fechaGMT4:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000);
    comment.date = fechaGMT4;
    restaurant.reviews.push(comment);
    return await restaurant.save();
  }

  async updateComment(idRestaurant: string, idComment: string, data: any, userId: string):Promise<any> {
    try {
      const { comment, calificacion } = data;
      const restaurant = await this.restaurantModel.findById(idRestaurant);
     // console.log(restaurant)
      const commentToUpdate = restaurant.reviews.find((c) => c._id.toString() == idComment);
      //console.log(commentToUpdate)
      if (!commentToUpdate || commentToUpdate.idUser !== userId) {
        return null;
      }
      
      if (comment !== undefined) {
        commentToUpdate.comment = comment;
      }
  
      if (calificacion !== undefined) {
        commentToUpdate.calification = calificacion;
      }
      const fechaUTC:Date = new Date();
      const fechaGMT4:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000);
      commentToUpdate.date = fechaGMT4;
      await restaurant.save();
    return restaurant;
    } catch (error) { console.error(error); }
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
  async agregarDenunciaComentario(idComentario: string, idRestaurante: string, observacion: string, razon: string, idDenunciante: string) {
    const fechaUTC:Date = new Date();
    const fechaGMT4:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000);
    const denunciarComentario = {
      "razon":razon,
      "observacion": observacion,
      "idComentario": idComentario,
      "idDenunciado": idRestaurante,
      "idDenunciante": idDenunciante,
      "fecha": fechaGMT4
    };
    const comentarioDenunciado = await this.denunciaModel.create(denunciarComentario);
    return await comentarioDenunciado.save();
  }

  async agregarDenunciaRestaurante(idRestaurante: string, observacion: string, razon: string, idDenunciante: string) {
    const fechaUTC:Date = new Date();
    const fechaGMT4:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000);
    const denunciarRestaurante = {
      "razon":razon,
      "observacion": observacion,
      "idDenunciado": idRestaurante,
      "idDenunciante": idDenunciante,
      "fecha": fechaGMT4
    };
    const restauranteDenunciado = await this.denunciaModel.create(denunciarRestaurante);
    return await restauranteDenunciado.save();
  }

  async procesarDenuncia(denunciaID: string, denunciaData: any, adminID: string): Promise<Denuncia> {
    //el valor {new:true} se usa para retornar la denuncia despues de actualizarla
    const denuncia = {
      ...denunciaData,
      "idAdministrador":adminID
    }
    const denunciaProcesada = await this.denunciaModel.findByIdAndUpdate(denunciaID, denuncia, {new:true});
    return denunciaProcesada;
  }
}
