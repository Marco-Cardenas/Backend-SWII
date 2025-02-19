import { Module, forwardRef } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { CrudService } from './crud.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { RestaurantSchema } from './schemas/restaurant.schema';
import { AuthModule } from '../auth/auth.module';
import { EscaneoSchema } from './schemas/escaneo.schema';
import { DenunciaSchema } from './schemas/denuncia.schema';

@Module({
  imports:[MongooseModule.forFeature([
    { name: 'Escaneos', schema: EscaneoSchema },
    { name: 'User', schema: UserSchema },
    { name: 'Restaurant', schema: RestaurantSchema },
    { name: 'Denuncias', schema: DenunciaSchema }
  ]),
  forwardRef(() => AuthModule), 
],
  controllers: [CrudController],
  providers: [CrudService],
  exports: [CrudService],

})
export class CrudModule {}
