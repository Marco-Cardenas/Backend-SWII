import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CrudModule } from './crud/crud.module';
import { AuthModule } from './auth/auth.module'; 

@Module({
  imports: [
    CrudModule,
    MongooseModule.forRoot('mongodb+srv://software2:software2@cluster0.7wc3n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}