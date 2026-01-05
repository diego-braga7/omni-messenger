import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { MessageStatus } from '../enums/message-status.enum';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly repo: Repository<Message>,
  ) {}

  async create(data: Partial<Message>): Promise<Message> {
    const message = this.repo.create(data);
    return this.repo.save(message);
  }

  async findById(id: string): Promise<Message | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: MessageStatus, externalId?: string): Promise<void> {
    const updateData: Partial<Message> = { status };
    if (externalId) {
      updateData.externalId = externalId;
    }
    await this.repo.update(id, updateData);
  }

  async findAll(): Promise<Message[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
