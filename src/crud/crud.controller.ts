import { Controller, Post, Res, Body, HttpStatus, Get, Param, Put, Delete, UseGuards, Request, Req } from '@nestjs/common';
import { response, Response } from 'express';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CrudService } from './crud.service';
import { CreateUserDTO } from './dto/user.dto';
import { CreateRestaurantDTO } from './dto/restaurant.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { loginDto } from '../auth/login.dto';
import { CreateEscaneoDTO } from './dto/escaneo.dto';
import { CreateUserSwaggerDTO } from './dto/create-user-swagger.dto';
import { reviewObject } from './interfaces/restaurant.interface';
import { Types,ObjectId } from 'mongoose';
import { updateCommentDto } from './dto/update-comment.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { request } from 'http';

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
  @ApiResponse({ status: 401, description: 'Email duplicado' })
  async createUser(@Res() resp, @Body() userDTO: CreateUserDTO) {
    const newUser = await this.crudService.createUser(userDTO);
    if (!newUser) {
      return resp.status(HttpStatus.UNAUTHORIZED).json({
        message:"Email duplicado"
      });
    }
    const token = await this.authService.login(newUser);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Creado',
      token: token.access_token
    });
  }

@Post('createAdmin')
@UseGuards(JwtAuthGuard, RolesGuard) 
@Roles('admin') // Solo admins pueden acceder
@ApiOperation({ summary: 'Create a new admin (admin only)' })
@ApiBody({ type: CreateUserSwaggerDTO })
@ApiResponse({ 
  status: 200, 
  description: 'Admin created successfully.',
})
@ApiResponse({ status: 400, description: 'Bad request.' })
@ApiResponse({ status: 401, description: 'Email duplicado' })
@ApiResponse({ status: 403, description: 'Forbidden. Requires admin role' })
async createAdmin(
  @Res() resp,
  @Body() adminDTO: CreateUserDTO,
) {
  const newAdmin = await this.crudService.createAdmin(adminDTO);
  if (!newAdmin) {
    return resp.status(HttpStatus.UNAUTHORIZED).json({
      message: "Email duplicado"
    });
  }
  return resp.status(HttpStatus.OK).json({
    message: 'Administrador creado exitosamente',
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
  @Get('getUser/:id')
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
    if(!userFound) {
      return resp.status(HttpStatus.NOT_FOUND).json({
        message: "User not found."
      }) 
    }

    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Encontrado',
      userFound: userFound
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all names that match the requested name',
    description: 'Performs a request to the Users database, and filters the users only by those who have a name similar to the requested one.'
  })
  @Get('getUserByName/:nameUser')
  async getUserByName(@Res() resp, @Param('nameUser') nameUser: string) {
    const userFound = await this.crudService.getUserByName(nameUser);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Encontrado',
      userFound: userFound
    });
  }

  @Post('forgotPassword')
  @ApiOperation({ summary: 'Checks if an email exists in the database' })
  @ApiResponse({ status: 200, description: 'Este correo existe' })
  @ApiResponse({ status: 400, description: 'No existe este correo' })
  async forgotPassword(@Res() respuesta: Response, @Body() body: { email: string }) {
    const emailValid = await this.crudService.forgotPassword(body.email);
    if(!emailValid) {
      return respuesta.status(400).json({
        message: 'No existe este correo'


      })
    }

    return respuesta.status(HttpStatus.OK).json({
      message: 'Este correo existe'
    })
  }
  
  @Post('validSecurityQuestion/:idUser')
  @ApiOperation({ summary: 'Validates user answers to security questions' })
  @ApiResponse({ status: 200, description: 'Las preguntas y respuestas han coincidido' })
  @ApiResponse({ status: 400, description: 'Las respuestas son incorrectas' })
  async validQuestion(
    @Res() respuesta: Response, 
    @Param('idUser') idUser: string,  
    @Body() body: { preguntasSeguridad: { pregunta: string, respuesta: string }[]}) {
    const isValidQuestion = await this.crudService.validSecurityQuestion(idUser, body.preguntasSeguridad);
    if(!isValidQuestion) {
      return respuesta.status(400).json({
        message: 'Las respuestas son incorrectas'
      })
    }

    return respuesta.status(HttpStatus.OK).json({
      message: 'Las preguntas y respuestas han coincidido',
      isValidQuestion
    })
  }

  @Post('changePassword/:idUser')
  @ApiOperation({ summary: 'Change user password using bcrypt' })
  @ApiResponse({ status: 200, description: 'Se ha actualizado la contraseña correctamente' })
  async changePassword(
    @Res() respuesta: Response, 
    @Body() body: { password: string },
    @Param('idUser') idUser: string) {
    const user = await this.crudService.changePassword(idUser, body.password);
    return respuesta.status(HttpStatus.OK).json({
      message: 'Se ha actualizado la contrasena correctamente'
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post('addFavoriteRestaurant')
  @ApiOperation({ summary: 'Add a restaurant to user favorites' })
  @ApiBody({ 
    schema: {
      example: {
        restaurantId: "string"
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Restaurant added to favorites successfully.', 
    schema: {
      example: {
        message: 'Restaurante añadido a favoritos',
        userUpdated: {
          _id: "user_id",
          favorites: ["restaurant_id_1", "restaurant_id_2"]
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Restaurant or User not found.' })
  @ApiResponse({ status: 400, description: 'Restaurant already in favorites.' })
  async addFavoriteRestaurant(
    @Res() resp: Response,
    @Request() req,
    @Body() body: { restaurantId: string }
  ) {
    try {
      const userId = req.user.userId; // Obtenemos el ID del usuario desde el token
      const { restaurantId } = body;

      // Verificamos si el restaurante existe
      const restaurant = await this.crudService.getRestaurant(restaurantId);
      if (!restaurant) {
        return resp.status(HttpStatus.NOT_FOUND).json({
          message: 'Restaurante no encontrado'
        });
      }

      // Añadimos el restaurante a los favoritos del usuario
      const userUpdated = await this.crudService.addRestaurantToFavorites(userId, restaurantId);
      
      if (!userUpdated) {
        return resp.status(HttpStatus.NOT_FOUND).json({
          message: 'Usuario no encontrado'
        });
      }

      return resp.status(HttpStatus.OK).json({
        message: 'Restaurante añadido a favoritos',
        userUpdated
      });
    } catch (error) {
      return resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al añadir restaurante a favoritos',
        error: error.message
      });
    }
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
  async updateUser(@Res() resp, @Param('id') userID: string, @Body() userData: any) {
    const userUpdated = await this.crudService.updateUser(userID, userData);
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
      return respuesta.status(HttpStatus.OK).json({
        message:"Administradores no pueden crear restaurantes"
      });
    }
    else {
      restaurantDTO.own = req.user.userId; //Se establece al usuario como dueño
      
      await this.crudService.updateUser(req.user.userId, { typo: "propietario" }); //Se actualiza el typo de usuario (a propietario)
      newRestaurant = await this.crudService.createRestaurant(restaurantDTO); //Se crea el restaurante
    }

    return respuesta.status(HttpStatus.OK).json({
      message: 'Restaurante Creado',
      newRestaurant
    });
  }

  //EDITAR
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
  async getRestaurant(@Res() respuesta, @Param('id') restaurantID: string, @Request() req) {
    const restaurantFound = await this.crudService.getRestaurant(restaurantID);

    //Se agrega el restaurante al historial del usuario
    await this.crudService.updateUserHistorial(req.user.userId, restaurantID);

    //se verifica si el restaurante fue dado like por la persona
    const liked = await this.crudService.isRestaurantLiked(req.user.userId, restaurantID);
  
    return respuesta.status(HttpStatus.OK).json({
      message: 'Restaurante Encontrado',
      restaurantFound,
      liked
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all names that match the requested name',
    description: 'Performs a request to the Restaurant database, and filters the Restaurant only by those who have a name similar to the requested one.'
  })
  @Get('getRestaurantsByName/:nameRestaurant')
  async getRestaurantsByName(@Res() resp, @Param('nameRestaurant') nameRestaurant: string) {
    const userFound = await this.crudService.getRestaurantsByName(nameRestaurant);
    return resp.status(HttpStatus.OK).json({
      message: 'Usuario Encontrado',
      userFound: userFound
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
  @ApiParam({ name: 'idUser', description: 'User ID', type: String })
  @ApiBody({
    description: 'List of restaurant IDs to delete from history',
    schema: {
      example: {
        idRestaurants: ['67b72b65d459601debcb9dd4'],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Restaurants deleted from showed list successfully.',
    schema: {
      example: {
        resultado: 'Restaurantes eliminados del historial',
      },
    },
  })
  async deleteRestaurantsFromShowed(@Res() resp, @Param('idUser') userID: string, @Body() body: { idRestaurants: string[] }) {
    const result = await this.crudService.deleteRestaurantsFromShowed(userID, body.idRestaurants);
    return resp.status(HttpStatus.OK).json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Put('deleteRestaurantFromLiked/:idUser')
  @ApiOperation({ summary: 'Delete restaurants from liked list by user ID' })
  @ApiParam({ name: 'idUser', description: 'User ID', type: String })
  @ApiBody({
    description: 'List of restaurant IDs to delete from favorites',
    schema: {
      example: {
        idRestaurants: ['67b72b65d459601debcb9dd4'],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Restaurants deleted from liked list successfully.',
    schema: {
      example: {
        resultado: 'Restaurantes eliminados de favoritos',
      },
    },
  })
  async deleteRestaurantFromLiked(@Res() resp, @Param('idUser') userID: string, @Body() body: { idRestaurants: string[] }) {
    const result = await this.crudService.deleteRestaurantFromLiked(userID, body.idRestaurants);
    return resp.status(HttpStatus.OK).json(result);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('getNearbyRestaurants/:latitud/:longitud/:anguloCamara/:distanciaRequerida')
  @ApiOperation({ summary: 'Get nearby restaurants within a scanning angle and a specific distance' })
    @ApiBody({ 
    schema: {
      example: {
        foto: "string"
      }
    }
  })
  @ApiResponse({
    status: 200, description: 'Nearby restaurants retrieved successfully within the specified distance.', schema: {
      example: {
        message: 'Restaurantes cercanos dentro de la distancia',
        escaneosNear: [],
      },
    },
  })
  async getNearbyRestaurants( 
    @Res() respuesta: Response, 
    @Param('latitud') latitud: number, 
    @Param('longitud') longitud: number, 
    @Param('anguloCamara') anguloCamara: number,
    @Param('distanciaRequerida') distanciaRequerida: number,
    @Request() req,
    @Body() body: { foto: string }
  ) {
    try {
      const escaneosNear = await this.crudService.getNearbyRestaurants(
        latitud, longitud,anguloCamara,distanciaRequerida, req.user.userId, body.foto
      );
      return respuesta.status(200).json({
        message: 'Restaurantes cercanos dentro de la distancia',
        escaneosNear
      });
    } catch (error) {
      console.error(error);
    }
  }

  //!Comentarios
  @Get('getCommentById/:restaurantId/:commentRequested')
  @ApiOperation({
    summary: 'Get the comment ID',
    description: `
      Searches the restaurant database for the requested comment
      - restaurantID. This is the ID of the restaurant
      - commentText. Is the content of the comment
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Se ha detectado una coincidencia',
    schema: {
      example: {
        message: 'Se ha detectado una coincidencia',
        commentID: 0
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'No se han encontrado coincidencias',
    schema: {
      example: {
        message: 'No se han encontrado coincidencias',
        commentID: -1
      }
    }
  })
  async getCommentById(
    @Res() respuesta: Response,
    @Param('restaurantId') restaurantID: string,
    @Param('commentRequested') commentRequested: string
  ) {
    try {
      const commentID = await this.crudService.getCommentById(restaurantID, commentRequested);
      if(commentID == -1) {
        return respuesta.status(400).json({
          message: 'No se han encontrado coincidencias',
          commentID
        })
      }

      return respuesta.status(HttpStatus.OK).json({
        message: 'Se ha detectado una coincidencia',
        commentID
      })
    } catch(err) {
      console.error(err);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('addComment/:idRestaurant')
  @ApiOperation({ summary: 'add comment to a restaurant' })
  @ApiResponse({
    status: 200, description: 'comment successfully added to a restaurant.', schema: {
      example: {
        message: 'comment added',
        comment: {},
      },
    },
  })
  @ApiBody({schema: {
    example: {
        comment: "string",
       calification: "number",
    },
  }})
  @ApiResponse({ status: 404, description: 'Restaurant not found.' })
  async addComentario(@Param('idRestaurant') idRestaurant:string, @Body() coment:reviewObject, @Res() resp, @Request() req){
    try{
      const idUser = req.user.userId;
      const restaurantComment = await this.crudService.addComment(idRestaurant, coment, idUser);
      if(!restaurantComment){
        return resp.status(404).json({
          message:"Restaurant not found"
        })
      }

      resp.status(201).json({
        message:"comment added sucessfully"
      })
    } catch(err) { console.error(err); }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update Restaurants comment' })
  @ApiResponse({ status: 200, description: 'comentario actualizado' })
  @ApiResponse({ status: 400, description: 'Error al actualizar comentario' })
  @ApiBody({ type:  updateCommentDto})
  @Put('updateComment/:idRestaurant')
  async updateComment(@Param('idRestaurant') idRes:string, @Body() updateData:any, @Res() resp, @Request() req) {
    const idUser = req.user.userId;
    const updatedComment = await this.crudService.updateComment(idRes,idUser,updateData);

    return resp.status(HttpStatus.OK).json({
      message: "Mensaje actualizado",
      updatedComment
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Delete a comment corresponding to a restaurant',
    description: `
      Deletes a comment based on the restaurant that was made and the id of the comment.
      @Param idComent[string]. The id of the user who made the offending comment.
      @Param idRestaurant[string]. The id of the Restaurant where the comment was made.
    `
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "El comentario ha sido eliminado",
    schema: {
      example: {
        message: "El comentario ha sido eliminado",
        comment: { }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "No se ha encontrado el comentario",
    schema: {
      example: {
        message: "No se ha encontrado el comentario",
        comment: "null"
      }
    }
  })
  @Delete('deleteComment/:idRestaurant/:idComment')
  async deleteComment(
    @Res() respuesta: Response,
    @Param('idRestaurant') idRestaurant: string,
    @Param('idComment') idComment: string
  ) {
    const commentDeleted = await this.crudService.deleteCommentById(idRestaurant, idComment);

    if(!commentDeleted) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: "No se ha encontrado el comentario",
        commentDeleted
      })
    }

    return respuesta.status(HttpStatus.OK).json({
      message: "El comentario ha sido eliminado",
      commentDeleted
    })
  }

  //!Denuncias
  @UseGuards(JwtAuthGuard)
  @Get('getDenuncias')
  @ApiOperation({ summary: 'Get all denuncies' })
  @ApiResponse({
    status: 200, description: 'OK', schema: {
      example: {
        denuncies:[]
      },
    },
  })
  @ApiResponse({
    status: 404, description: 'Denuncies not Found', schema: {
      example: {
        message:"Denuncies not found"
      },
    },
  })
  async getDenuncias(@Res() respuesta: Response) {
    const denuncias = await this.crudService.getAllDenuncias({});
    return respuesta.status(HttpStatus.OK).json({
      message: "Todas las denuncias encontradas",
      denuncias
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Collect the Denuncia that match the established filter.',
    description: `
      Performs a query to the Denuncia database to obtain only those Denuncia that match the requested Denuncia characteristic or attributes. In other words, you decide which characteristic you want to filter by.
      `
  })
  @ApiResponse({
    status: 200,
    description: 'Denuncias encontradas con el filtro',
    schema:{
      example: {
        message: "Denuncias encontradas con el filtro",
        denuncies: []
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Denuncies not found',
    schema: {
      example: {
        message: 'Denuncies not found'
      }
    }
  })
  @Post('filtrarDenuncias')
  async filtrarDenuncias(@Res() respuesta: Response, @Body() opcionesFiltrado: any) {
    const denunciasFiltradas = await this.crudService.getAllDenuncias(opcionesFiltrado);
    if (denunciasFiltradas.length === 0) {
      return respuesta.status(400).json({
        message: 'Denuncies not found'
      });
    }
    
    return respuesta.status(HttpStatus.OK).json({
      message: "Denuncias encontradas con el filtro",
      denunciasFiltradas
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtain a report based on its ID.',
    description: `
      Performs a query of the complaint database, and looks for a match based on the complaint ID.
      - The idComentario is the position (index) in the database of Denuncia.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Denuncia encontrada',
    schema: {
      example: {
        message: "Denuncia encontrada",

        razon: 'Comentario Despectivo',
        observacion: 'Es un insulto cruel a una etnia',
        idComentario: '3',
        idDenunciado: '67bdc873461c09f13d2326db',
        idDenunciante: '67bdc873461c09f13d2326db',
        idAdministrador: '67bdc873461c09f13d2326db',
        tipo: 'EN PROCESO',
        fecha: 'Tue Mar 26 2024 10:30:00',
        tiempoBaneo: '4'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'No se ha encontrado coincidencias'
  })
  @Get('getDenuncia/:id')
  async getDenuncia(@Res() respuesta: Response, @Param('id') idDenuncia: string) {
    const denunciaEncontrada = await this.crudService.getDenuncia(idDenuncia);
    return respuesta.status(HttpStatus.OK).json({
      message: "Denuncia encontrada",
      denunciaEncontrada
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Send to process a Denuncia',
    description: `
      Send the denuncia to the Denuncia database so that an administrator can process it (Adds the administrator ID to the idAdministrador attribute).
      - id. This is the ID of the Denuncia to be processed.
      - The identification of the administrator processing the Denuncia is sent through the body.
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Denuncia Procesada',
    schema: {
      example: {
        razon: 'Comentario Despectivo',
        observacion: 'Es un insulto cruel a una etnia',
        idComentario: '3',
        idDenunciado: '67bdc873461c09f13d2326db',
        idDenunciante: '67bdc873461c09f13d2326db',
        idAdministrador: '67be5b52d099ecd7755b6c21',
        tipo: 'EN PROCESO',
        fecha: 'Tue Mar 26 2024 10:30:00',
        tiempoBaneo: '4'
      }
    }
  })
  @Post('procesarDenuncia/:id')
  async procesarDenuncia(@Res() respuesta, @Param('id') idDenuncia: string, @Body() estadoDenuncia: any, @Request() req) {
    const denunciaProcesada = await this.crudService.procesarDenuncia(idDenuncia, estadoDenuncia, req.user.userId);
    return respuesta.status(HttpStatus.OK).json({
      message: "Denuncia Procesada",
      denunciaProcesada
    });
  }

  //Tipo de estado del comentario: EN PROCESO, BANEADO, OMITIDO
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        observacion: { type: 'string' },
        razon: { type: 'string' }
      }
    }
  })
  @Post('denunciarComentario/:idRestaurante/:idComentario')
  async denunciarComentario(@Res() respuesta, @Param('idComentario') idComentario: string, @Param('idRestaurante') idRestaurante: string, @Body() obs: any, @Request() req) {
    await this.crudService.agregarDenunciaComentario(idComentario, idRestaurante, obs.observacion, obs.razon, req.user.userId);
    return respuesta.status(HttpStatus.OK).json({
      message: "Comentario denunciado correctamente"
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        observacion: { type: 'string' },
        razon: { type: 'string' }
      }
    }
  })
  @Post('denunciarRestaurante/:idRestaurante')
  async denunciarRestaurante(@Res() respuesta, @Param('idRestaurante') idRestaurante: string, @Body() obs: any, @Request() req) {
    await this.crudService.agregarDenunciaRestaurante(idRestaurante, obs.observacion, obs.razon, req.user.userId);
    return respuesta.status(HttpStatus.OK).json({
      message: "Restaurante denunciado correctamente"
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('eliminarDenuncia/:denunciaID')
  @ApiOperation({
    summary: 'Delete a Denuncia based on its ID',
    description: 'Searches the Denuncia database for a Denuncia matching the ID and deletes it.'
  })
  @ApiResponse({
    status: 200,
    description: 'Denunciada eliminada correctamente',
    schema: {
      example: {
        message: 'Denunciada eliminada correctamente',

        razon: 'Comentario Despectivo',
        observacion: 'Es un insulto cruel a una etnia',
        idComentario: '3',
        idDenunciado: '67bdc873461c09f13d2326db',
        idDenunciante: '67bdc873461c09f13d2326db',
        idAdministrador: '67be5b52d099ecd7755b6c21',
        tipo: 'EN PROCESO',
        fecha: 'Tue Mar 26 2024 10:30:00',
        tiempoBaneo: '4'
      }
    }
  })
  async eliminarDenuncia(@Res() respuesta: Response, @Param('denunciaID') denunciaID: string) {
    const denunciaDeleted = await this.crudService.deleteDenuncia(denunciaID);
    return respuesta.status(HttpStatus.OK).json({
      message: 'Denunciada eliminada correctamente',
      denunciaDelete: denunciaDeleted
    })
  }

  // ELIMINAR DATOS DE LA BASE DE DATOS
  @Get('eliminarBaseDatosUser')
  async eliminarBaseDatosUser() {
    await this.crudService.eliminarBaseDatosUser();
  }

  @Get('eliminarBaseDatosRestaurant')
  async eliminarBaseDatosRestaurant() {
    await this.crudService.eliminarBaseDatosRestaurant();
  }

  @Get('eliminarBaseDatosDenuncia')
  async eliminarBaseDatosDenuncia() {
    await this.crudService.eliminarBaseDatosDenuncia()
  }  
  @Get('eliminarBaseDatosEscaneo')
  async eliminarBaseDatosEscaneo() {
    await this.crudService.eliminarBaseDatosEscaneo()
  }
}