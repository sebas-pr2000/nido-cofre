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
import { ActorDto, ChooseOptionDto, ThankDto } from './dto/receiver-actions.dto.js';

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

  @Post(':id/open')
  @HttpCode(200)
  open(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActorDto) {
    return this.giftsService.open(id, dto);
  }

  @Post(':id/choose')
  @HttpCode(200)
  choose(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChooseOptionDto) {
    return this.giftsService.choose(id, dto);
  }

  @Post(':id/thank')
  @HttpCode(200)
  thank(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ThankDto) {
    return this.giftsService.thank(id, dto);
  }
}