import { Injectable } from '@nestjs/common';
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

  async getEscaneoNearUser(latitud: number, longitud: number, anguloCamara: number) {
    // Recopilamos los restaurantes que esten cercanos a un radio de 1.11 km para no sobrecargar de informacion, segun el Degree Precision (1.11 km = 0.01 grados)
    const allRestaurants = await this.restaurantModel.find({
      "address.latitud": {$lte: latitud + 0.007, $gte: latitud - 0.007},
      "address.longitud": {$lte: longitud + 0.007, $gte: longitud - 0.007}
    });

    // Obtenemos los restaurante ubicado en ± 45 grados del angulo donde apunta la camara
    const escaneosNear = allRestaurants.filter(restaurant => {
      let angulo = Math.atan2(restaurant.address.longitude - longitud, restaurant.address.latitude - latitud) * 180 / Math.PI;
      //Se ajusta el angulo para que este entre 0 y 360
      angulo = (angulo + 360) % 360;
      //Se calcula la diferencia entre el angulo de la camara y el angulo del escaneo
      let diferencia = Math.abs(anguloCamara - angulo);
      //Se ajusta la diferencia para que este entre 0 y 180
      diferencia = (diferencia + 180) % 180;
      //Se retorna si la diferencia es menor o igual a 45 grados
      return diferencia <= 45;
    })

    return escaneosNear;
  }

  async getEscaneoNearUserFromDistance(latitud: number, longitud: number, anguloCamara: number, distanciaRequerida: string) {
    // Conversion de grados a radianes
    const convertRadians = (coordinates: number) => coordinates * Math.PI / 180;
      
    // Radio de la tierra en kilometros
    const earthRadius = 6371; 

    // Primer filto. Recopilamos los restaurantes que esten cercanos a 1.11 km para no sobrecargar de informacion, segun el Degree Precision (1.11 km = 0.01 grados)
    const allRestaurants = await this.restaurantModel.find({
      "address.latitud": {$lte: latitud + 0.007, $gte: latitud - 0.007},
      "address.longitud": {$lte: longitud + 0.007, $gte: longitud - 0.007}
    });

    const escaneosNear = allRestaurants.filter(restaurant => {
      // latitud y longitud en radianes
      const lat = convertRadians(latitud);
      const lon = convertRadians(longitud);
      const lat1Rad = convertRadians(restaurant.address.latitude);
      const lon1Rad = convertRadians(restaurant.address.longitude);
      
      // Diferencia de latitud y longitud
      const differenceLat = lat - lat1Rad;
      const differenceLon = lon - lon1Rad;

      // Formula de Haversine
      const a = Math.sin(differenceLat / 2) * Math.sin(differenceLat / 2) + Math.sin(differenceLon / 2) * Math.sin(differenceLon / 2) * Math.cos(lat) * Math.cos(lat);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = earthRadius * c;

      let angulo = Math.atan2(restaurant.address.longitude - longitud, restaurant.address.latitude - latitud) * 180 / Math.PI;
      //Se ajusta el angulo para que este entre 0 y 360
      angulo = (angulo + 360) % 360;
      //Se calcula la diferencia entre el angulo de la camara y el angulo del escaneo
      let diferencia = Math.abs(anguloCamara - angulo);
      //Se ajusta la diferencia para que este entre 0 y 180
      diferencia = (diferencia + 180) % 180;
      
      // Retorno si la diferencia es menor o igual a 45 grados y la distancia es menor o igual a la distancia dada
      return diferencia <= 45 && distance <= parseFloat(distanciaRequerida);
    })

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

  async addComment(idRestaurant:string,comment:reviewObject):Promise<any>{
      const restaurant = await this.restaurantModel.findById(idRestaurant)
      if(!restaurant){
        return null
      }
    restaurant.reviews.push(comment);
    return await restaurant.save();
  }

  
  //Servicios de Denuncias
  async createDenuncia(denunciaDTO: CreateDenunciaDTO): Promise<Denuncia> {
    const newDenuncia = await this.denunciaModel.create(denunciaDTO);
    return await newDenuncia.save();
  }

  async getAllDenuncias(opciones: any): Promise<Denuncia[]> {
    const denunciasFound = await this.denunciaModel.find({opciones});
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
