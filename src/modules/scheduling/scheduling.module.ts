import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Professional } from './entities/professional.entity';
import { Service } from './entities/service.entity';
import { Appointment } from './entities/appointment.entity';
import { ConversationState } from './entities/conversation-state.entity';
import { GoogleCalendarService } from './services/google-calendar.service';
import { GoogleCalendarController } from './controllers/google-calendar.controller';
import { ProfessionalsController } from './controllers/professionals.controller';
import { SchedulingService } from './services/scheduling.service';
import { ProfessionalsService } from './services/professionals.service';
import { SchedulingConsumer } from './scheduling.consumer';
import { ConfigModule } from '@nestjs/config';
import { MessengerModule } from '../messenger/messenger.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Professional,
      Service,
      Appointment,
      ConversationState,
    ]),
    MessengerModule,
    UsersModule,
  ],
  controllers: [SchedulingConsumer, GoogleCalendarController, ProfessionalsController],
  providers: [GoogleCalendarService, SchedulingService, ProfessionalsService],
  exports: [TypeOrmModule, GoogleCalendarService, SchedulingService, ProfessionalsService],
})
export class SchedulingModule {}
