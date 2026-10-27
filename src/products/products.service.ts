import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface ProductFilters {
  category?: string;
  maxPrice?: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll({ category, maxPrice }: ProductFilters) {
    return this.prisma.product.findMany({
      where: {
        category,
        price: maxPrice !== undefined ? { lte: maxPrice } : undefined,
        stock: { gt: 0 },
      },
      orderBy: { price: 'asc' },
    });
  }
}