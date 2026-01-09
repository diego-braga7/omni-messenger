import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MessageStatus } from '../enums/message-status.enum';
import { MessageType } from '../enums/message-type.enum';
import { MessageTemplate } from './message-template.entity';
import { User } from '../../users/entities/user.entity';
import { ZApiReturn } from './z-api-return.entity';

@Entity('messages')
@Index(['status'])
@Index(['to'])
@Index(['createdAt'])
export class Message {
  @ApiProperty({ example: 'uuid-v4' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '5511999999999' })
  @Column()
  to: string;

  @ApiProperty({ nullable: true })
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, (user) => user.messages, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ type: () => ZApiReturn, required: false })
  @OneToOne(() => ZApiReturn, (zApiReturn) => zApiReturn.message)
  zApiReturn: ZApiReturn;

  @ApiProperty({ example: 'Olá, mundo!' })
  @Column('text')
  content: string;

  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @ApiProperty({ enum: MessageStatus, example: MessageStatus.PENDING })
  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING,
  })
  status: MessageStatus;

  @ApiProperty({ nullable: true })
  @Column({ name: 'external_id', nullable: true })
  externalId: string;

  @ApiProperty({ nullable: true })
  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @ManyToOne(() => MessageTemplate, (template) => template.messages, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: MessageTemplate;

  // Campos extras para envio de documento
  @ApiProperty({ nullable: true })
  @Column({ name: 'file_name', nullable: true })
  fileName: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  extension: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  caption: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
