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
import { emit } from 'process';

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

  async getNearbyRestaurants(
    latitud: number, 
    longitud: number, 
    anguloCamara: number, 
    distanciaRequerida: number,
    idUser: string,
    foto: string
  ) {
    // Radio de la tierra en kilómetros
    const earthRadius = 6371;

    // Convertimos la distancia requerida de metros a kilómetros
    const distanceKm = distanciaRequerida / 1000;

    // Conversión de grados a radianes
    const convertRadians = (coordinates: number) => coordinates * Math.PI / 180;

    const calculateDistance = (latitudUser: number, longitudUser: number, latitudeRestaurant: number, longitudeRestaurant): number => {
      // Longitudes y latitudes en Radianes
      const lat = convertRadians(latitudUser);
      const lon = convertRadians(longitudUser);
      const lat1Rad = convertRadians(latitudeRestaurant);
      const lon1Rad = convertRadians(longitudeRestaurant);
      
      // Diferencia de latitud y longitud
      const differenceLat = lat - lat1Rad;
      const differenceLon = lon - lon1Rad;

      // Fórmula de Haversine
      const a = Math.sin(differenceLat / 2) * Math.sin(differenceLat / 2) + 
                Math.sin(differenceLon / 2) * Math.sin(differenceLon / 2) * 
                Math.cos(lat) * Math.cos(lat1Rad);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = earthRadius * c;   

      return distance 
    };

    // Recopilamos todos los restaurantes
    const allRestaurants = await this.restaurantModel.find({});

    const escaneosNear = [];
    const idRestaurants = [];
    
    for(const restaurant of allRestaurants) {
      const distance = calculateDistance(latitud, longitud, restaurant.latitude, restaurant.longitude);
      
      // Comprobamos que la distancia del restaurante sea menor o igual a la requerida
      if(distance <= distanceKm) {
        const restaurantData = { ...restaurant.toObject(), distance };
        delete restaurantData.fotos;

        // Insertamos el restaurante cercano
        escaneosNear.push(restaurant);

        // Insertamos el id del restaurante cercano 
        idRestaurants.push(restaurant._id);
      }
    }

    const fechaUTC:Date = new Date();
    const fechaGMT4:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000);
    const escaneos = new this.escaneoModel({
      foto: foto,
      latitud: latitud,
      longitud: longitud,
      anguloCamara: anguloCamara,
      fecha: fechaGMT4,
      idUser: idUser,
      restaurantesCercanos: idRestaurants
    });

    await this.createEscaneo(escaneos); 
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
      return null;
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(userDTO.password, salt);
    const newUser = new this.userModel({
      ...userDTO,
      password: hashedPassword,
      typo: 'user',
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
    if(!user) {
      return null;
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email });
    return user;
  }

  async getUserByName(name: string) {
    // Retorna los usuarios que concuerdan con el nombre solicitado
    const users = await this.getAllUsers({});
    const usersMatch = users.filter(user => {
      return RegExp(name, 'i').test(user.name)
    })
    return usersMatch;
  }

  async updateUserHistorial(userID: string, viewedRestaurant: string):Promise<any> {
    //el valor {new:true} se usa para retornar el usuario despues de actualizarlo
    const historialActualizado = await this.userModel.findByIdAndUpdate(userID, { $push:{ historial:viewedRestaurant } }, {new:true});
    return historialActualizado;
  }

  async updateUser(userID: string, userData: any): Promise<User> {
    if (userData.password !== undefined) {
      const salt = await bcrypt.genSalt()
      userData.password = await bcrypt.hash(userData.password, salt); 
    }
    const userUpdated = await this.userModel.findByIdAndUpdate(userID, userData, { new: true });
    return userUpdated;
  }


  async deleteUser(userID: string): Promise<User> {
    //el valor {new:false} se usa para retornar el usuario antes de ser borrado
    //const userDeleted = await this.userModel.findByIdAndDelete(userID, {new:false});
    const user = await this.userModel.findById(userID);
    if(!user) {
      return null;
    }

    const userDeleted = await this.userModel.findByIdAndUpdate(userID, { deshabilitarDatos: true }, { new: true })
    return userDeleted;
  }

  async forgotPassword(email: string): Promise<boolean> {
      const user = await this.getUserByEmail(email);
      return user != null && user != undefined;
  }

  async validSecurityQuestion(idUser: string, preguntasDeSeguridad: { pregunta: string, respuesta: string }[]): Promise<boolean> {
    const user = await this.getUser(idUser);
    if(!user) {
      return null;
    }
    const isValid = user.preguntasDeSeguridad.every(preguntaUser => {
      return preguntasDeSeguridad.some(preguntaComprobar => {
        preguntaUser.pregunta === preguntaComprobar.pregunta && preguntaUser.respuesta === preguntaComprobar.respuesta
      })
    })
    return isValid;
  }

  async changePassword(idUser: string, password: string): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.userModel.findByIdAndUpdate(
      idUser,
      {password: hashedPassword},
      {new: true}
    );
    return user;
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
    const restaurantsLiked = await this.restaurantModel.find({ _id: { $in: user.favorites }, deshabilitarDatos: false });
    return restaurantsLiked;
  }

  async isRestaurantLiked(userID: string, idRestaurant: string): Promise<boolean> {
    const user = await this.userModel.findById(userID);
    const favorites = user.favorites;
    return favorites.includes(idRestaurant);
  }

  async getRestaurantsShowed(userID: string): Promise<Restaurant[]> {
    const user = await this.userModel.findById(userID);
    if (!user || !user.historial.length) {
      return [];
    }
    const restaurantsShowed = await this.restaurantModel.find({ _id: { $in: user.historial }, deshabilitarDatos: false });
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
    if(!restaurant) {
      return null;
    }
    return restaurant;
  }

  async getRestaurantsByName(name: string) {
    // Retorna los restaurantes que concuerdan con el nombre solicitado
    const restaurants = await this.getAllRestaurants({ deshabilitarDatos: false });
    const restaurantsMatch = restaurants.filter(restaurant => {
      return RegExp(name, 'i').test(restaurant.name)
    })
    return restaurantsMatch;
  }

  async updateRestaurant(restaurantID: string, restaurantData: any): Promise<Restaurant> {
    //el valor {new:true} se usa para retornar la tienda despues de actualizarla
    const restaurantUpdated = await this.restaurantModel.findByIdAndUpdate(restaurantID, restaurantData, {new:true});
    return restaurantUpdated;
  }

  async deleteRestaurant(restaurantID: string): Promise<Restaurant> {
    //el valor {new:true} se usa para retornar la tienda despues de ser actualizada con su deshabilitarDatos en true
    const restaurantDeleted = await this.restaurantModel.findByIdAndUpdate(restaurantID, { deshabilitarDatos: true }, {new:true});
    return restaurantDeleted;
  }

  async getCommentById(restaurantID: string, commentRequested: string) {
    // Obtenemos la informacion del restaurante
    const dataRestaurant = await this.restaurantModel.findById(restaurantID);

    // Buscamos la primera coincidencia con respecto al comentario solicitado
    const commentID = dataRestaurant.reviews.findIndex(review => review.comment === commentRequested);
    return commentID;
  }


  async addComment(idRestaurant:string, comment:reviewObject, idUser:string):Promise<any>{

    const restaurant = await this.restaurantModel.findById(idRestaurant);
    //Verificar existencia del restaurante
    if(!restaurant){
      return null;
    }
    const user = await this.userModel.findById(idUser);
    //Verificar que el usuario no haya comentado aun
    const usuarioYaComento = restaurant.reviews.some(comentarios => comentarios.idUser == idUser);
    if(usuarioYaComento) {
      return 'Ya Comento';
    }
    comment.idUser = idUser;
    comment.userName = user.name;
    const fechaUTC:Date = new Date();
    const fechaGMT4:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000);
    comment.date = fechaGMT4;
    restaurant.reviews.push(comment);
    return await restaurant.save();
  }

  async updateComment(idRestaurant: string, idComment: string, data: any):Promise<any> {
    const restaurant = await this.restaurantModel.findById(idRestaurant);
    if(!restaurant) {
      return null;
    }
    const { comment, calification } = data;

    const commentToUpdate = restaurant.reviews.find((comentario) => comentario.idUser == idComment);
    //verifica que el id del comentario sea igual al del usuario
    if(!commentToUpdate || commentToUpdate.idUser !== idComment){
      return null;
    }

    if(comment != undefined) {
      commentToUpdate.comment = comment;
    }

    if(calification != undefined) {
      commentToUpdate.calification = calification;
    }

    const fechaUTC:Date = new Date();
    const fechaGMT4:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000);
    commentToUpdate.date = fechaGMT4;
    
    const comentarioActualizado = await this.restaurantModel.findOneAndUpdate(
      {_id:idRestaurant, 'reviews.idUser':idComment},
      {$set: { 'reviews.$.comment':commentToUpdate.comment, 'reviews.$.calification':commentToUpdate.calification, 'reviews.$.date':commentToUpdate.date}},
      {new:true}
    ).exec();
    return comentarioActualizado;
  }
  
  async deleteCommentById(idRestaurant: string, idComment: string): Promise<any> {
    const restaurant = await this.restaurantModel.findById(idRestaurant);
    if(!restaurant) {
      return null;
    }

    const reviewExists = restaurant.reviews.some(review => review.idUser === idComment);
    if(!reviewExists) {
      return null;
    }

    const commentDeleted = await this.restaurantModel.findByIdAndUpdate(
      idRestaurant,
      {
        $pull: {reviews: { idUser: idComment }},
      },
      { new: true }
    )
    return commentDeleted;
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
    try {
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
    catch(error) {
      console.error(error);
      throw error;
    }
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

  async procesarDenuncia(denunciaID: string, denunciaData: any, adminID: string) {
    //el valor {new:true} se usa para retornar la denuncia despues de actualizarla
    const fechaUTC:Date = new Date();
    const fechaGMT4:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000);
    const denuncia = {
      ...denunciaData,
      "idAdministrador":adminID,
      "fecha":fechaGMT4
    }

    if(denuncia.tipo == 'OMITIDO') {
      denuncia.tiempoBaneo = 0;
      const denunciaProcesada = await this.denunciaModel.findByIdAndUpdate(denunciaID, denuncia, {new:true});
      if(!denunciaProcesada) {
        return null;
      }
      return denunciaProcesada;  
    }
    else if(denuncia.tipo == 'BANEADO') {
      const denunciado = await this.denunciaModel.findById(denunciaID); //Buscamos la denuncia
      if(!denunciado) {
        return null;
      }

      //Se denuncio fue un restaurante
      if(denunciado.idComentario == '') {
        const restaurante = await this.restaurantModel.findById(denunciado.idDenunciado);
        if(!restaurante) {
          return null;
        }

        const tiempoBaneado: Date = new Date(fechaUTC.getTime() - (4*60*60*1000) + (denuncia.tiempoBaneo * 1000));
        //Ponemos el tiempo de Baneo actual al restaurante
        await this.restaurantModel.findByIdAndUpdate(denunciado.idDenunciado, { tiempoBaneo: tiempoBaneado });

        //Actualizamos la denuncia Procesada
        const denunciaProcesada = await this.denunciaModel.findByIdAndUpdate(denunciaID, denuncia, { new: true });

        return denunciaProcesada;
      }
      else {
        //Se denuncio un comentario
        const usuario = await this.userModel.findById(denunciado.idComentario);
        if(!usuario) {
          return null;
        }
        
        const tiempoBaneado: Date = new Date(fechaUTC.getTime() - (4*60*60*1000) + (denuncia.tiempoBaneo * 1000));
        //Ponemos el tiempo de Baneo al usuario
        await this.userModel.findByIdAndUpdate(denunciado.idComentario, { tiempoBaneo: tiempoBaneado });

        //Actualizamos la denuncia Procesada
        const denunciaProcesada = await this.denunciaModel.findByIdAndUpdate(denunciaID, denuncia, { new: true });

        return denunciaProcesada;
      }

    }
    return null;
  }

  async verifyBan(id: string, typo: string):Promise<boolean> {

    if(typo == 'user') {
      //Verificar Baneo de un usuario
      const user = await this.userModel.findById(id);
      if(!user) {
        return null;
      }
      const fechaUTC:Date = new Date();
      const fechaActual:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000); //Tomamos la fecha actual

      const fechaMaximaDelBaneo: Date = new Date(user.tiempoBaneo); //La fecha maxima en que el baneo esta activo
      
      if(fechaMaximaDelBaneo > fechaActual) {
        return true;
      }
      else {
        await this.userModel.findByIdAndUpdate(id, {tiempoBaneo: 0}, {new: true}); // le eliminamos el tiempo de baneo al usuario
        return false;
      }
    }
    else if(typo == 'restaurant') {
      const restaurant = await this.restaurantModel.findById(id);
      if(!restaurant) {
        return null;
      }
      const fechaUTC:Date = new Date();
      const fechaActual:Date = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000); //Tomamos la fecha actual

      const fechaMaximaDelBaneo: Date = new Date(restaurant.tiempoBaneo); //La fecha maxima en que el baneo esta activo
      
      if(fechaMaximaDelBaneo > fechaActual) {
        return true;
      }
      else {
        await this.restaurantModel.findByIdAndUpdate(id, {tiempoBaneo: 0}, {new:true}); // le eliminamos el tiempo de baneo al restaurante
        return false;
      }
    }
  }

  // ELIMINAR DATOS DE LA BD

  async eliminarBaseDatosUser() {
    await this.userModel.deleteMany( { } );
  }

  async eliminarBaseDatosRestaurant() {
    await this.restaurantModel.deleteMany( { } );
  }
  async eliminarBaseDatosDenuncia() {
    await this.denunciaModel.deleteMany( { } );
  }  
  async eliminarBaseDatosEscaneo() {
    await this.escaneoModel.deleteMany( { } );
  }
}
