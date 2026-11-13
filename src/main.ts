import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  if (process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('FoodBridge API')
      .setDescription(
        'Demo local. Reemplaza los UUID de ejemplo por los devueltos por la API.',
      )
      .setVersion('1.0')
      .build();
    SwaggerModule.setup(
      'docs',
      app,
      SwaggerModule.createDocument(app, config),
      {
        jsonDocumentUrl: 'docs-json',
      },
    );
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
