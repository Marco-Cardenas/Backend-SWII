import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CrudModule } from '../crud/crud.module';

@Module({
  imports: [
    forwardRef(() => CrudModule),
    PassportModule,
    JwtModule.register({
      global:true,
      secret: 'secretKey', // cambiar
      signOptions: { /*expiresIn: '60m' */},
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}