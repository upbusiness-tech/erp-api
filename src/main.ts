import { NestFactory } from '@nestjs/core';
import 'tsconfig-paths/register';
import { AppModule } from './app.module';

// Função usada pela Vercel
export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    cors: false, // habilitaremos manualmente
  });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      '*', // garantir fallback
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  await app.init();
  return app.getHttpAdapter().getInstance();
}

// Rodar apenas localmente:
if (!process.env.VERCEL) {
  (async () => {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: [
        'http://localhost:5173',
      ],
      methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization',
      credentials: true,
    });

    await app.listen(process.env.PORT ?? 3001);
    console.log('API rodando localmente na porta ' + (process.env.PORT ?? 3001));
  })();
}
