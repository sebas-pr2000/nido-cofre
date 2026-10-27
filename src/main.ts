import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  });
  
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API en http://localhost:${port}/api`);
}
await bootstrap();
