import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageTemplateRepository } from '../repositories/message-template.repository';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';

@Injectable()
export class TemplateService {
  constructor(private readonly repository: MessageTemplateRepository) {}

  async create(dto: CreateTemplateDto) {
    return this.repository.create(dto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    const template = await this.repository.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id); // Check existence
    return this.repository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    return this.repository.delete(id);
  }
}
