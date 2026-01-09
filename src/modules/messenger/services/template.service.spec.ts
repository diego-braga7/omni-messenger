import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { MessageTemplateRepository } from '../repositories/message-template.repository';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { MessageType } from '../enums/message-type.enum';
import { NotFoundException } from '@nestjs/common';

describe('TemplateService', () => {
  let service: TemplateService;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        { provide: MessageTemplateRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a template', async () => {
      const dto: CreateTemplateDto = {
        name: 'Test',
        content: 'Content',
        type: MessageType.TEXT,
      };
      mockRepository.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto);
      expect(result).toEqual({ id: '1', ...dto });
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findOne', () => {
    it('should return a template if found', async () => {
      const template = { id: '1', name: 'Test' };
      mockRepository.findById.mockResolvedValue(template);

      expect(await service.findOne('1')).toEqual(template);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});
