import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate } from '../entities/message-template.entity';

@Injectable()
export class MessageTemplateRepository {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly repo: Repository<MessageTemplate>,
  ) {}

  async create(data: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const template = this.repo.create(data);
    return this.repo.save(template);
  }

  async findAll(): Promise<MessageTemplate[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<MessageTemplate | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<MessageTemplate>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
