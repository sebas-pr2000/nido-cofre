import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USD_TO_COP = 4000;

// Categorías de DummyJSON → categorías de Nido
const CATEGORIES: Record<string, string> = {
  'womens-bags': 'Moda',
  'mens-shirts': 'Moda',
  'sunglasses': 'Moda',
  'womens-jewellery': 'Moda',
  'mobile-accessories': 'Tecnología',
  'home-decoration': 'Hogar',
  'kitchen-accessories': 'Hogar',
  'beauty': 'Belleza',
  'fragrances': 'Belleza',
  'skin-care': 'Belleza',
};

interface DummyProduct {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  stock: number;
}

interface DummyResponse {
  products: DummyProduct[];
}

// Redondea a miles: 23.960 → 24.000
function toCop(usd: number): number {
  return Math.round((usd * USD_TO_COP) / 1000) * 1000;
}

async function main() {
  // 1. Limpiar regalos previos (orden importa por las llaves foráneas)
  await prisma.payment.deleteMany();
  await prisma.giftOption.deleteMany();
  await prisma.gift.deleteMany();

  // 2. Usuarios de prueba
  const users = [
    { id: 'andres', name: 'Andrés' },
    { id: 'laura', name: 'Laura' },
  ];

  for (const u of users) {
    const data = {
      name: u.name,
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${u.id}`,
      creditBalance: 0,
    };
    await prisma.user.upsert({
      where: { id: u.id },
      update: data,
      create: { id: u.id, ...data },
    });
  }

  // 3. Catálogo desde DummyJSON
  for (const [slug, category] of Object.entries(CATEGORIES)) {
    const url = `https://dummyjson.com/products/category/${slug}?limit=5&select=title,price,thumbnail,stock`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`DummyJSON respondió ${res.status} para "${slug}"`);
    }
    const { products } = (await res.json()) as DummyResponse;

    for (const p of products) {
      const data = {
        title: p.title,
        price: toCop(p.price),
        imageUrl: p.thumbnail,
        category,
        stock: p.stock,
      };
      await prisma.product.upsert({
        where: { id: p.id },
        update: data,
        create: { id: p.id, ...data },
      });
    }
  }

  const total = await prisma.product.count();
  console.log(`✅ Seed listo: ${users.length} usuarios y ${total} productos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());