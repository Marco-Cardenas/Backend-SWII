import { Controller, Post, Res, Body, HttpStatus, Get, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { CrudService } from './crud.service';
import { CreateUserDTO } from './dto/user.dto';
import { CreateRestaurantDTO } from './dto/restaurant.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { loginDto } from 'src/auth/login.dto';
import { CreateEscaneoDTO } from './dto/escaneo.dto';


@Controller('...')
export class CrudController {

  constructor(
    private readonly crudService: CrudService,
    private readonly authService: AuthService
  ){}

  //Direcciones de los usuarios
  @Post('createUser')
  async createUser(@Res() resp, @Body() userDTO: CreateUserDTO) {
    const newUser = await this.crudService.createUser(userDTO);
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
  async getAllUsers(@Res() respuesta) {
    const usersFound = await this.crudService.getAllUsers({});
    return respuesta.status(HttpStatus.OK).json({
      message: 'Todos los Usuarios',
      usersFound
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
  //CREAR RESTAURANTE
  @UseGuards(JwtAuthGuard)
  @Post('createRestaurant')
  async createRestaurant(@Res() respuesta, @Body() restaurantDTO: CreateRestaurantDTO, @Request() req) {
    const user = await this.crudService.getUser(req.user.userId);
    let newRestaurant = undefined;
    if(user.typo == 'admin') {
      newRestaurant = await this.crudService.createRestaurant(restaurantDTO);
    }
    else if(user.typo == 'user'){
      restaurantDTO.own = req.user.userId; //Se establece al usuario como dueño
      
      await this.crudService.updateUser(req.user.userId, { typo: "propietario" }); //Se actualiza el typo de usuario (a propietario)
      newRestaurant = await this.crudService.createRestaurant(restaurantDTO); //Se crea el restaurante
    }

    return respuesta.status(HttpStatus.OK).json({
      message: 'Restaurante Creado',
      newRestaurant
    });
  }

  //OBTENER TODOS LOS RESTAURANTES POR TYPO USER
  @UseGuards(JwtAuthGuard)
  @Get('getRestaurants')
  async getAllRestaurants(@Res() respuesta, @Request() req) {
    const user = await this.crudService.getUser(req.user.userId);
    let restaurantsFound = undefined;
    if(user.typo == 'admin') {
      restaurantsFound = await this.crudService.getAllRestaurants({});
    }
    else if(user.typo == 'propietario') {
      restaurantsFound = await this.crudService.getAllRestaurants({own:req.user.userId});
    }

     return respuesta.status(HttpStatus.OK).json({
      message: 'Todos los Restaurantes',
      restaurantsFound
    });
  }

  //OBTENER INFO DE UN RESTAURANTE
  @UseGuards(JwtAuthGuard)
  @Get('getRestaurant/:id')
  async getRestaurant(@Res() respuesta, @Param('id') restaurantID: string) {
    const restaurantFound = await this.crudService.getRestaurant(restaurantID);
    return respuesta.status(HttpStatus.OK).json({
      message: 'Restaurante Encontrado',
      restaurantFound
    });
  }

  //ACTUALIZAR INFO DE UN RESTAURANTE
  @UseGuards(JwtAuthGuard)
  @Put('updateRestaurant/:id')
  async updateRestaurant(@Res() respuesta, @Param('id') restaurantID: string, @Body() restaurantData: any) {
    const restaurantUpdated = await this.crudService.updateRestaurant(restaurantID, restaurantData);
    return respuesta.status(HttpStatus.OK).json({
      message: 'Restaurante Actualizado',
      restaurantUpdated
    });
  }

  //ELIMINAR UN RESTAURANTE
  @UseGuards(JwtAuthGuard)
  @Delete('deleteRestaurant/:id')
  async deleteRestaurant(@Res() respuesta, @Param('id') restaurantID: string) {
    const restaurantDeleted = await this.crudService.deleteRestaurant(restaurantID); //Eliminamos el restaurante

    //Revisamos si el propietario solo es propietario del restaurante eliminado
    const restaurantsOfUser = await this.crudService.getAllRestaurants({ own:restaurantDeleted.own });
    if(restaurantsOfUser.length == 0) {
      await this.crudService.updateUser(restaurantDeleted.own, { typo: "user" }); //Se cambia el propietario a typo "user"
    }

    return respuesta.status(HttpStatus.OK).json({
      message: 'Restaurante Borrado',
      restaurantDeleted
    });
  }


  //FILTRAR RESTAURANTES POR CARACTERISTICAS
  @UseGuards(JwtAuthGuard)
  @Get('filterRestaurants')
  async filterRestaurants(@Res() respuesta, @Body() opcionesFiltro: any) {
    const filteredRestaurants = await this.crudService.getAllRestaurants(opcionesFiltro);
    return respuesta.status(HttpStatus.OK).json({
      message: "Restaurantes que cumplen el filtro",
      filteredRestaurants
    });
  }

  //FILTRAR RESTAURANTES POR CARACTERISTICAS
  @UseGuards(JwtAuthGuard)
  @Get('filterUsers')
  async filterUsers(@Res() respuesta, @Body() opcionesFiltro: any) {
    const filteredUsers = await this.crudService.getAllUsers(opcionesFiltro);
    return respuesta.status(HttpStatus.OK).json({
      message: "Usuarios que cumplen el filtro",
      filteredUsers
    });
  }

  //OBTENER RESTAURANTES CERCANOS
  @UseGuards(JwtAuthGuard)
  @Get('obtainRestaurants')
  async getRestaurantsFromScanner(@Res() respuesta, @Body() EscaneoDTO: CreateEscaneoDTO) {
    await this.crudService.createEscaneo(EscaneoDTO);
    
    const jsonOpciones = 'falta terminarlo con los datos';
    const neerestRestaurants = await this.crudService.getAllRestaurants(jsonOpciones);
    return respuesta.status(HttpStatus.OK).json({
      message: "Restaurantes cercanos segun la imagen",
      neerestRestaurants
    });
  }

}
