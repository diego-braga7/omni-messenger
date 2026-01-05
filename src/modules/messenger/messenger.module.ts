import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MessengerController } from './messenger.controller';
import { ZApiProvider } from './providers/z-api/z-api.service';
import { MESSENGER_PROVIDER } from './messenger.constants';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [MessengerController],
  providers: [
    ZApiProvider,
    {
      provide: MESSENGER_PROVIDER,
      useExisting: ZApiProvider, // Por enquanto usamos ZApi diretamente, mas a interface permite troca fácil
    },
  ],
  exports: [MESSENGER_PROVIDER],
})
export class MessengerModule {}
