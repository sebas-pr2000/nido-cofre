import { Module } from '@nestjs/common';
import { GiftsController } from './gifts.controller.js';
import { GiftsService } from './gifts.service.js';

@Module({
  controllers: [GiftsController],
  providers: [GiftsService]
})
export class GiftsModule {}
