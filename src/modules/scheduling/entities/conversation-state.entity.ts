import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationStep } from '../enums/conversation-step.enum';

@Entity('conversation_states')
export class ConversationState {
  @PrimaryColumn()
  phone: string;

  @Column({
    type: 'enum',
    enum: ConversationStep,
  })
  step: ConversationStep;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
