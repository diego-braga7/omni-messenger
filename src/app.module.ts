import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getTypeOrmConfig } from './config/typeorm.config';
import { RabbitmqModule } from './modules/rabbitmq/rabbitmq.module';
import { MessengerModule } from './modules/messenger/messenger.module';
import { UsersModule } from './modules/users/users.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { THROTTLER_CONFIG } from './common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLER_CONFIG.TTL,
        limit: THROTTLER_CONFIG.LIMIT,
      },
    ]),
    RabbitmqModule,
    UsersModule,
    MessengerModule,
    SchedulingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
