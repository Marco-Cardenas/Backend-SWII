import { Controller, Post, Res, Body, HttpStatus, Get, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { CrudService } from './crud.service';
import { CreateUserDTO } from './dto/user.dto';
import { CreateRestaurantDTO } from './dto/restaurant.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { loginDto } from 'src/auth/login.dto';
import { Response } from 'express';


@Controller('...')
export class CrudController {

  constructor(
    private readonly crudService: CrudService,
    private readonly authService: AuthService
  ){}

  //Direcciones de los usuarios
  @Post('createUser')
  async createUser(@Res() resp:Response, @Body() userDTO: CreateUserDTO) {
    const newUser = await this.crudService.createUser(userDTO,resp);

    if (!newUser || newUser.status) {
      return;
  }
      const token = await this.authService.login(newUser);
      return resp.status(HttpStatus.OK).json({
        message: 'Usuario Creado',
        token: token.access_token
      });
    
  }

  @Post('login')
  async login(@Res() resp, @Body() loginDTO:loginDto){
    const user = await this.authService.validateUser(loginDTO.email, loginDTO.password);
    if (!user) {
      return resp.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Credenciales inválidas',
      });
    }
    const token = await this.authService.loginFromMongoose(user);
    return resp.status(HttpStatus.OK).json({
      message: 'Inicio de sesión exitoso',
      token: token.access_token
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUsers')
  async getAllUsers(@Res() resp) {
    const usersFound = await this.crudService.getAllUsers();
    return resp.status(HttpStatus.OK).json({
      message: 'Todos los Usuarios',
      usersFound: usersFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUsers/:id')
  async getUser(@Res() resp, @Param('id') userID: string) {
    const userFound = await this.crudService.getUser(userID);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Encontrado',
      userFound: userFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUser/:idUser')
  async getUserById(@Res() resp, @Param('idUser') userID: string) {
    const userFound = await this.crudService.getUser(userID);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Encontrado',
      userFound: userFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getRestaurantsLiked/:idUser')
  async getRestaurantsLiked(@Res() resp, @Param('idUser') userID: string) {
    const restaurantsLiked = await this.crudService.getRestaurantsLiked(userID);
    return resp.status(HttpStatus.OK).json({
      message: 'Restaurantes Favoritos',
      restaurants: restaurantsLiked
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('updateUser/:id')
  async updateUser(@Res() resp, @Param('id') userID: string, @Body() userDTO: CreateUserDTO) {
    const userUpdated = await this.crudService.updateUser(userID, userDTO);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Actualizado',
      userUpdated: userUpdated
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleteUser/:id')
  async deleteUser(@Res() resp, @Param('id') userID: string) {
    const userDeleted = await this.crudService.deleteUser(userID);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Borrado',
      userDeleted: userDeleted
    });
  }

  //Direcciones de los restaurantes
  @UseGuards(JwtAuthGuard)
  @Post('createRestaurant')
  async createRestaurant(@Res() resp, @Body() restaurantDTO: CreateRestaurantDTO) {
    const newRestaurant = await this.crudService.createRestaurant(restaurantDTO);
    return resp.status(HttpStatus.OK).json({
      message: 'Restaurante Creado',
      newRestaurant
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getRestaurants')
  async getAllRestaurants(@Res() resp) {
    const restaurantsFound = await this.crudService.getAllRestaurants();
    return resp.status(HttpStatus.OK).json({
      message: 'Todos los Restaurantes',
      restaurantsFound: restaurantsFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getRestaurants/:id')
  async getRestaurant(@Res() resp, @Param('id') restaurantID: string) {
    const restaurantFound = await this.crudService.getRestaurant(restaurantID);
    return resp.status(HttpStatus.OK).json({
      message: 'Tienda Encontrada',
      restaurantFound: restaurantFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('updateRestaurant/:id')
  async updateRestaurant(@Res() resp, @Param('id') restaurantID: string, @Body() restaurantDTO: CreateRestaurantDTO) {
    const restaurantUpdated = await this.crudService.updateRestaurant(restaurantID, restaurantDTO);
    return resp.status(HttpStatus.OK).json({
      message: 'Tienda Actualizada',
      restaurantUpdated: restaurantUpdated
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleteRestaurant/:id')
  async deleteRestaurant(@Res() resp, @Param('id') restaurantID: string) {
    const restaurantDeleted = await this.crudService.deleteRestaurant(restaurantID);
    return resp.status(HttpStatus.OK).json({
      message: 'Tienda Borrada',
      restaurantDeleted: restaurantDeleted
    });
  }
}
