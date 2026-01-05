import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const rmqUri = configService.get<string>('RABBITMQ_URI');

  if (rmqUri) {
    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [rmqUri],
        queue: 'main_queue',
        noAck: false,
        queueOptions: {
          durable: true,
        },
      },
    });

    await app.startAllMicroservices();
  }

  await app.listen(3000);
}
bootstrap();
