import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Professional } from './entities/professional.entity';
import { Service } from './entities/service.entity';
import { Appointment } from './entities/appointment.entity';
import { ConversationState } from './entities/conversation-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Professional,
      Service,
      Appointment,
      ConversationState,
    ]),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class SchedulingModule {}
