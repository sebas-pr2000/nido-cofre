import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { GiftNotifier } from '../realtime/gift-notifier.service.js';
import type { CreateGiftDto } from './dto/create-gift.dto.js';
import { GiftsService } from './gifts.service.js';

const users = [
  { id: 'andres', name: 'Andrés' },
  { id: 'laura', name: 'Laura' },
];

const products = [
  { id: 1, title: 'Gafas', price: 50_000, stock: 5 },
  { id: 2, title: 'Perfume', price: 80_000, stock: 5 },
  { id: 3, title: 'Bolso', price: 120_000, stock: 5 },
];

const validDto: CreateGiftDto = {
  senderId: 'andres',
  receiverId: 'laura',
  budget: 150_000,
  message: '  ¡Feliz cumpleaños!  ',
  productIds: [1, 2, 3],
};

function setup(options: { users?: unknown[]; products?: unknown[] } = {}) {
  const prisma = {
    user: { findMany: vi.fn().mockResolvedValue(options.users ?? users) },
    product: { findMany: vi.fn().mockResolvedValue(options.products ?? products) },
    gift: { create: vi.fn().mockResolvedValue({ id: 'gift-1' }) },
  };
  const notifier = { notify: vi.fn() };

  const service = new GiftsService(
    prisma as unknown as PrismaService,
    notifier as unknown as GiftNotifier,
  );

  return { service, prisma };
}

describe('GiftsService.create', () => {
  it('no permite enviarse un cofre a sí mismo', async () => {
    const { service, prisma } = setup();

    await expect(
      service.create({ ...validDto, receiverId: 'andres' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('falla si quien recibe no existe', async () => {
    const { service } = setup({ users: [users[0]] });

    await expect(service.create(validDto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('falla si algún producto no existe', async () => {
    const { service } = setup({ products: products.slice(0, 2) });

    await expect(service.create(validDto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza opciones que superan el presupuesto y dice cuáles', async () => {
    const { service } = setup();

    await expect(service.create({ ...validDto, budget: 100_000 })).rejects.toThrow(/Bolso/);
  });

  it('rechaza opciones sin stock', async () => {
    const { service } = setup({
      products: [products[0], products[1], { ...products[2], stock: 0 }],
    });

    await expect(service.create(validDto)).rejects.toThrow(/Sin stock: Bolso/);
  });

  it('crea el cofre con el mensaje limpio y las opciones en orden', async () => {
    const { service, prisma } = setup();

    await service.create(validDto);

    expect(prisma.gift.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message: '¡Feliz cumpleaños!',
          budget: 150_000,
          options: {
            create: [
              { productId: 1, position: 0 },
              { productId: 2, position: 1 },
              { productId: 3, position: 2 },
            ],
          },
        }),
      }),
    );
  });

  it('pone vencimiento de 7 días', async () => {
    const { service, prisma } = setup();
    const before = Date.now();

    await service.create(validDto);

    const { data } = prisma.gift.create.mock.calls[0][0];
    const days = (data.expiresAt.getTime() - before) / (24 * 60 * 60 * 1000);
    expect(days).toBeCloseTo(7, 1);
  });
});