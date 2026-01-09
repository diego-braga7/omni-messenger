import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Message } from './message.entity';

@Entity('z_api_returns')
export class ZApiReturn {
  @ApiProperty({ description: 'ID da mensagem (FK)', example: 'uuid-v4' })
  @PrimaryColumn({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @ApiProperty({ description: 'ID da mensagem na Z-API', example: '328328238' })
  @Column({ name: 'zaap_id', nullable: false })
  zaapId: string;

  @ApiProperty({ description: 'ID interno do retorno Z-API', example: 'AD7S8D7S8D7' })
  @Column({ name: 'id', nullable: false })
  id: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Message)
  @JoinColumn({ name: 'message_id' })
  message: Message;
}
