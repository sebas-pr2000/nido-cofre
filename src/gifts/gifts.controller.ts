import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GiftsService } from './gifts.service.js';
import { CreateGiftDto } from './dto/create-gift.dto.js';
import { PaymentsService } from '../payments/payments.service.js';
import { CheckoutDto } from './dto/checkout.dto.js';

@Controller('gifts')
export class GiftsController {
  constructor(
    private readonly giftsService: GiftsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateGiftDto) {
    return this.giftsService.create(dto);
  }

  @Get('sent/:userId')
  findSent(@Param('userId') userId: string) {
    return this.giftsService.findSent(userId);
  }

  @Get('received/:userId')
  findReceived(@Param('userId') userId: string) {
    return this.giftsService.findReceived(userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('viewerId') viewerId?: string,
  ) {
    if (!viewerId) {
      throw new BadRequestException('viewerId es requerido');
    }
    return this.giftsService.findOne(id, viewerId);
  }


  @Post(':id/checkout')
  @HttpCode(200)
  async checkout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckoutDto,
  ) {
    await this.paymentsService.checkout(id, dto);
    return this.giftsService.findOne(id, dto.payerId);
  }
}