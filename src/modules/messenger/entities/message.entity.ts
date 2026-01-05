import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { MessageStatus } from '../enums/message-status.enum';
import { MessageType } from '../enums/message-type.enum';
import { MessageTemplate } from './message-template.entity';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
@Index(['status'])
@Index(['to'])
@Index(['createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  to: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, (user) => user.messages, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING,
  })
  status: MessageStatus;

  @Column({ name: 'external_id', nullable: true })
  externalId: string;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @ManyToOne(() => MessageTemplate, (template) => template.messages, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: MessageTemplate;

  // Campos extras para envio de documento
  @Column({ name: 'file_name', nullable: true })
  fileName: string;

  @Column({ nullable: true })
  extension: string;

  @Column({ nullable: true })
  caption: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
