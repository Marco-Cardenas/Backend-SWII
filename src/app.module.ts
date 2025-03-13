import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CrudModule } from './crud/crud.module';
import { AuthModule } from './auth/auth.module'; 

@Module({
  imports: [
    CrudModule,
    MongooseModule.forRoot('mongodb+srv://admin:1234@cluster0.vkqnn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
