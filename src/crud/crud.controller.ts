import { Controller, Post, Res, Body, HttpStatus, Get, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CrudService } from './crud.service';
import { CreateUserDTO } from './dto/user.dto';
import { CreateRestaurantDTO } from './dto/restaurant.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { loginDto } from '../auth/login.dto';
import { CreateEscaneoDTO } from './dto/escaneo.dto';
import { CreateUserSwaggerDTO } from './dto/create-user-swagger.dto';

@ApiTags('api')
@Controller('api')
@ApiBearerAuth('JWT-auth') 
export class CrudController {

  constructor(
    private readonly crudService: CrudService,
    private readonly authService: AuthService
  ){}

  @Post('createUser')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserSwaggerDTO })
  @ApiResponse({ 
    status: 200, 
    description: 'User created successfully.', 
    schema: {
      example: {
        message: 'Usuario Creado',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async createUser(@Res() resp, @Body() userDTO: CreateUserDTO) {
    const newUser = await this.crudService.createUser(userDTO);
    const token = await this.authService.login(newUser);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Creado',
      token: token.access_token
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: loginDto })
  @ApiResponse({ status: 200, description: 'Login successful.', schema: {
    example: {
      message: 'Inicio de sesión exitoso',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  }})
  @ApiResponse({ status: 401, description: 'Invalid credentials.', schema: {
    example: {
      message: 'Credenciales inválidas',
    },
  }})
  async login(@Res() resp, @Body() loginDTO: loginDto) {
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
  @ApiBearerAuth()
  @Get('getUsers')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'All users retrieved successfully.', schema: {
    example: {
      message: 'Todos los Usuarios',
      usersFound: [],
    },
  }})
  async getAllUsers(@Res() respuesta) {
    const usersFound = await this.crudService.getAllUsers({});
    return respuesta.status(HttpStatus.OK).json({
      message: 'Todos los Usuarios',
      usersFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUsers/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found.', schema: {
    example: {
      message: 'Usuario Encontrado',
      userFound: {},
    },
  }})
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUser(@Res() resp, @Param('id') userID: string) {
    const userFound = await this.crudService.getUser(userID);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Encontrado',
      userFound: userFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUser/:idUser')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'idUser', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found.', schema: {
    example: {
      message: 'Usuario Encontrado',
      userFound: {},
    },
  }})
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@Res() resp, @Param('idUser') userID: string) {
    const userFound = await this.crudService.getUser(userID);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Encontrado',
      userFound: userFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getRestaurantsLiked/:idUser')
  @ApiOperation({ summary: 'Get liked restaurants by user ID' })
  @ApiParam({ name: 'idUser', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Liked restaurants retrieved successfully.', schema: {
    example: {
      message: 'Restaurantes Favoritos',
      restaurants: [],
    },
  }})
  async getRestaurantsLiked(@Res() resp, @Param('idUser') userID: string) {
    const restaurantsLiked = await this.crudService.getRestaurantsLiked(userID);
    return resp.status(HttpStatus.OK).json({
      message: 'Restaurantes Favoritos',
      restaurants: restaurantsLiked
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('updateUser/:id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: CreateUserDTO })
  @ApiResponse({ status: 200, description: 'User updated successfully.', schema: {
    example: {
      message: 'Usuario Actualizado',
      userUpdated: {},
    },
  }})
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(@Res() resp, @Param('id') userID: string, @Body() userDTO: CreateUserDTO) {
    const userUpdated = await this.crudService.updateUser(userID, userDTO);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Actualizado',
      userUpdated: userUpdated
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleteUser/:id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.', schema: {
    example: {
      message: 'Usuario Borrado',
      userDeleted: {},
    },
  }})
  @ApiResponse({ status: 404, description: 'User not found.' })
  async deleteUser(@Res() resp, @Param('id') userID: string) {
    const userDeleted = await this.crudService.deleteUser(userID);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Borrado',
      userDeleted: userDeleted
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('createRestaurant')
  @ApiOperation({ summary: 'Create a new restaurant' })
  @ApiBody({ type: CreateRestaurantDTO })
  @ApiResponse({ status: 200, description: 'Restaurant created successfully.', schema: {
    example: {
      message: 'Restaurante Creado',
      newRestaurant: {},
    },
  }})
  @ApiResponse({ status: 400, description: 'Bad request.' })
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

  @UseGuards(JwtAuthGuard)
  @Get('getRestaurants')
  @ApiOperation({ summary: 'Get all restaurants' })
  @ApiResponse({ status: 200, description: 'All restaurants retrieved successfully.', schema: {
    example: {
      message: 'Todos los Restaurantes',
      restaurantsFound: [],
    },
  }})
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

  @UseGuards(JwtAuthGuard)
  @Get('getRestaurant/:id')
  @ApiOperation({ summary: 'Get restaurant by ID' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({ status: 200, description: 'Restaurant found.', schema: {
    example: {
      message: 'Restaurante Encontrado',
      restaurantFound: {},
    },
  }})
  @ApiResponse({ status: 404, description: 'Restaurant not found.' })
  async getRestaurant(@Res() respuesta, @Param('id') restaurantID: string) {
    const restaurantFound = await this.crudService.getRestaurant(restaurantID);
    return respuesta.status(HttpStatus.OK).json({
      message: 'Restaurante Encontrado',
      restaurantFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getRestaurantsShowed/:idUser')
  @ApiOperation({ summary: 'Get restaurants showed by user ID' })
  @ApiParam({ name: 'idUser', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Restaurants showed retrieved successfully.', schema: {
    example: {
      message: 'Historial de Restaurantes Vistos',
      restaurants: [],
    },
  }})
  async getRestaurantsShowed(@Res() resp, @Param('idUser') userID: string) {
    const restaurantsShowed = await this.crudService.getRestaurantsShowed(userID);
    return resp.status(HttpStatus.OK).json({
      message: 'Historial de Restaurantes Vistos',
      restaurants: restaurantsShowed
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('updateRestaurant/:id')
  @ApiOperation({ summary: 'Update restaurant by ID' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiBody({ type: CreateRestaurantDTO })
  @ApiResponse({ status: 200, description: 'Restaurant updated successfully.', schema: {
    example: {
      message: 'Restaurante Actualizado',
      restaurantUpdated: {},
    },
  }})
  @ApiResponse({ status: 404, description: 'Restaurant not found.' })
  async updateRestaurant(@Res() respuesta, @Param('id') restaurantID: string, @Body() restaurantData: any) {
    const restaurantUpdated = await this.crudService.updateRestaurant(restaurantID, restaurantData);
    return respuesta.status(HttpStatus.OK).json({
      message: 'Restaurante Actualizado',
      restaurantUpdated
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleteRestaurant/:id')
  @ApiOperation({ summary: 'Delete restaurant by ID' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({ status: 200, description: 'Restaurant deleted successfully.', schema: {
    example: {
      message: 'Restaurante Borrado',
      restaurantDeleted: {},
    },
  }})
  @ApiResponse({ status: 404, description: 'Restaurant not found.' })
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

  @UseGuards(JwtAuthGuard)
  @Get('filterRestaurants')
  @ApiOperation({ summary: 'Filter restaurants by characteristics' })
  @ApiBody({ description: 'Filter options', type: Object })
  @ApiResponse({ status: 200, description: 'Filtered restaurants retrieved successfully.', schema: {
    example: {
      message: "Restaurantes que cumplen el filtro",
      filteredRestaurants: [],
    },
  }})
  async filterRestaurants(@Res() respuesta, @Body() opcionesFiltro: any) {
    const filteredRestaurants = await this.crudService.getAllRestaurants(opcionesFiltro);
    return respuesta.status(HttpStatus.OK).json({
      message: "Restaurantes que cumplen el filtro",
      filteredRestaurants
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('filterUsers')
  @ApiOperation({ summary: 'Filter users by characteristics' })
  @ApiBody({ description: 'Filter options', type: Object })
  @ApiResponse({ status: 200, description: 'Filtered users retrieved successfully.', schema: {
    example: {
      message: "Usuarios que cumplen el filtro",
      filteredUsers: [],
    },
  }})
  async filterUsers(@Res() respuesta, @Body() opcionesFiltro: any) {
    const filteredUsers = await this.crudService.getAllUsers(opcionesFiltro);
    return respuesta.status(HttpStatus.OK).json({
      message: "Usuarios que cumplen el filtro",
      filteredUsers
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('obtainRestaurants')
  @ApiOperation({ summary: 'Get nearby restaurants from scan' })
  @ApiBody({ type: CreateEscaneoDTO })
  @ApiResponse({ status: 200, description: 'Nearby restaurants retrieved successfully.', schema: {
    example: {
      message: "Restaurantes cercanos segun la imagen",
      neerestRestaurants: [],
    },
  }})
  async getRestaurantsFromScanner(@Res() respuesta, @Body() EscaneoDTO: CreateEscaneoDTO) {
    await this.crudService.createEscaneo(EscaneoDTO);
    
    const jsonOpciones = 'falta terminarlo con los datos';
    const neerestRestaurants = await this.crudService.getAllRestaurants(jsonOpciones);
    return respuesta.status(HttpStatus.OK).json({
      message: "Restaurantes cercanos segun la imagen",
      neerestRestaurants
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('deleteRestaurantsFromShowed/:idUser')
  @ApiOperation({ summary: 'Delete restaurants from showed list by user ID' })
  @ApiParam({ name: 'idUser', description: 'User ID' })
  @ApiBody({ description: 'List of restaurant IDs to delete', type: Object })
  @ApiResponse({ status: 200, description: 'Restaurants deleted from showed list successfully.', schema: {
    example: {
      message: 'Restaurantes eliminados del historial',
      result: {},
    },
  }})
  async deleteRestaurantsFromShowed(@Res() resp, @Param('idUser') userID: string, @Body() body: { idRestaurants: string[] }) {
    const result = await this.crudService.deleteRestaurantsFromShowed(userID, body.idRestaurants);
    return resp.status(HttpStatus.OK).json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Put('deleteRestaurantFromLiked/:idUser')
  @ApiOperation({ summary: 'Delete restaurant from liked list by user ID' })
  @ApiParam({ name: 'idUser', description: 'User ID' })
  @ApiBody({ description: 'List of restaurant IDs to delete', type: Object })
  @ApiResponse({ status: 200, description: 'Restaurant deleted from liked list successfully.', schema: {
    example: {
      message: 'Restaurante eliminado de favoritos',
      result: {},
    },
  }})
  async deleteRestaurantFromLiked(@Res() resp, @Param('idUser') userID: string, @Body() body: { idRestaurants: string[] }) {
    const result = await this.crudService.deleteRestaurantFromLiked(userID, body.idRestaurants);
    return resp.status(HttpStatus.OK).json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getEscaneoNearUser')
  @ApiOperation({ summary: 'Get nearby restaurants within a scanning angle' })
  @ApiResponse({ status: 200, description: 'Nearby restaurants retrieved successfully.', schema: {
      example: {
        message: 'Restaurantes cercanos',
        escaneosNear: [],
      },
    },})
  async getEscaneoNearUser( @Res() resp: Response, @Param('latitud') latitud: number, @Param('longitud') longitud: number, @Param('anguloCamara') anguloCamara: number) {
    const escaneosNear = await this.crudService.getEscaneoNearUser(latitud, longitud, anguloCamara);
    return resp.status(HttpStatus.OK).json({
      message: 'Restaurantes cercanos',
      escaneosNear,
    });
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('getEscaneoNearUserFromDistance')
  @ApiOperation({ summary: 'Get nearby restaurants within a scanning angle and a specific distance' })
  @ApiResponse({
    status: 200, description: 'Nearby restaurants retrieved successfully within the specified distance.', schema: {
      example: {
        message: 'Restaurantes cercanos dentro de la distancia',
        escaneosNear: [],
      },
    },
  })
  async getEscaneoNearUserFromDistance( @Res() respuesta: Response, @Param('latitud') latitud: number, @Param('longitud') longitud: number, @Param('anguloCamara') anguloCamara: number, @Param('distanciaRequerida') distanciaRequerida: string) {
    const escaneosNear = await this.crudService.getEscaneoNearUserFromDistance(latitud, longitud,anguloCamara,distanciaRequerida);
    return respuesta.status(200).json({
      message: 'Restaurantes cercanos dentro de la distancia',
      escaneosNear,
    });
  }
}
