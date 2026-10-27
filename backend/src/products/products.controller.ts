import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('maxPrice', new ParseIntPipe({ optional: true })) maxPrice?: number,
  ) {
    return this.productsService.findAll({ category, maxPrice });
  }
}