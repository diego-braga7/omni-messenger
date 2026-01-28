import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessengerController } from './messenger.controller';
import { TemplateController } from './template.controller';
import { WebhookController } from './webhook.controller';
import { ZApiProvider } from './providers/z-api/z-api.service';
import { MESSENGER_PROVIDER } from './messenger.constants';
import { MessengerService } from './services/messenger.service';
import { TemplateService } from './services/template.service';
import { MessageRepository } from './repositories/message.repository';
import { MessageTemplateRepository } from './repositories/message-template.repository';
import { ZApiReturnRepository } from './repositories/z-api-return.repository';
import { Message } from './entities/message.entity';
import { MessageTemplate } from './entities/message-template.entity';
import { ZApiReturn } from './entities/z-api-return.entity';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { MessengerConsumer } from './messenger.consumer';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([Message, MessageTemplate, ZApiReturn]),
    forwardRef(() => RabbitmqModule),
    UsersModule,
  ],
  controllers: [
    MessengerController,
    TemplateController,
    WebhookController,
    MessengerConsumer,
  ],
  providers: [
    ZApiProvider,
    {
      provide: MESSENGER_PROVIDER,
      useExisting: ZApiProvider,
    },
    MessengerService,
    TemplateService,
    MessageRepository,
    MessageTemplateRepository,
    ZApiReturnRepository,
  ],
  exports: [MESSENGER_PROVIDER, MessengerService],
})
export class MessengerModule {}
