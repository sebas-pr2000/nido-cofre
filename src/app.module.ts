import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { ProductsModule } from './products/products.module.js';
import { GiftsModule } from './gifts/gifts.module.js';

@Module({
  imports: [PrismaModule, UsersModule, ProductsModule, GiftsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
