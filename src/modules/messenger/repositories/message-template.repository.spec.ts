import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageTemplateRepository } from './message-template.repository';
import { MessageTemplate } from '../entities/message-template.entity';

describe('MessageTemplateRepository', () => {
  let repository: MessageTemplateRepository;

  const mockTypeOrmRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageTemplateRepository,
        {
          provide: getRepositoryToken(MessageTemplate),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<MessageTemplateRepository>(
      MessageTemplateRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a template', async () => {
      const data = { name: 'tpl', content: 'test' };
      const createdEntity = { id: '1', ...data };

      mockTypeOrmRepo.create.mockReturnValue(createdEntity);
      mockTypeOrmRepo.save.mockResolvedValue(createdEntity);

      const result = await repository.create(data);
      expect(result).toEqual(createdEntity);
      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(createdEntity);
    });
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      const templates = [{ id: '1' }, { id: '2' }];
      mockTypeOrmRepo.find.mockResolvedValue(templates);

      const result = await repository.findAll();
      expect(result).toEqual(templates);
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('should return a template by id', async () => {
      const template = { id: '1', name: 'tpl' };
      mockTypeOrmRepo.findOne.mockResolvedValue(template);

      const result = await repository.findById('1');
      expect(result).toEqual(template);
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const data = { name: 'updated' };
      await repository.update('1', data);
      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('1', data);
    });
  });

  describe('delete', () => {
    it('should delete a template', async () => {
      await repository.delete('1');
      expect(mockTypeOrmRepo.delete).toHaveBeenCalledWith('1');
    });
  });
});
