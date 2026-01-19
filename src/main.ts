import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RABBITMQ_QUEUE } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Omni Messenger API')
    .setDescription(
      'API para envio de mensagens via múltiplos canais (Z-API, etc)',
    )
    .setVersion('1.0')
    .addTag('Messenger')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const rmqUri = configService.get<string>('RABBITMQ_URI');

  if (rmqUri) {
    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [rmqUri],
        queue: RABBITMQ_QUEUE,
        noAck: false,
        queueOptions: {
          durable: true,
        },
      },
    });

    await app.startAllMicroservices();
  }

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
