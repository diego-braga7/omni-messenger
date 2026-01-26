import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Professional } from './entities/professional.entity';
import { Service } from './entities/service.entity';
import { Appointment } from './entities/appointment.entity';
import { ConversationState } from './entities/conversation-state.entity';
import { GoogleCalendarService } from './services/google-calendar.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Professional,
      Service,
      Appointment,
      ConversationState,
    ]),
  ],
  providers: [GoogleCalendarService],
  exports: [TypeOrmModule, GoogleCalendarService],
})
export class SchedulingModule {}
