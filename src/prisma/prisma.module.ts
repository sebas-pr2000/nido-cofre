import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// ? usamos el decorador Global para poder interactuar con prisma sin necesidad del exports, ni imports
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}