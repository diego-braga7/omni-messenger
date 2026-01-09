import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageRepository } from './message.repository';
import { Message } from '../entities/message.entity';
import { MessageStatus } from '../enums/message-status.enum';

describe('MessageRepository', () => {
  let repository: MessageRepository;
  let typeOrmRepo: Repository<Message>;

  const mockTypeOrmRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageRepository,
        {
          provide: getRepositoryToken(Message),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<MessageRepository>(MessageRepository);
    typeOrmRepo = module.get<Repository<Message>>(getRepositoryToken(Message));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a message', async () => {
      const data = { to: '123', content: 'test' };
      const createdEntity = { id: '1', ...data };
      
      mockTypeOrmRepo.create.mockReturnValue(createdEntity);
      mockTypeOrmRepo.save.mockResolvedValue(createdEntity);

      const result = await repository.create(data);
      expect(result).toEqual(createdEntity);
      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(createdEntity);
    });
  });

  describe('findById', () => {
    it('should return a message by id', async () => {
      const message = { id: '1', to: '123' };
      mockTypeOrmRepo.findOne.mockResolvedValue(message);

      const result = await repository.findById('1');
      expect(result).toEqual(message);
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['zApiReturn'],
      });
    });
  });

  describe('findAll', () => {
    it('should return all messages', async () => {
      const messages = [{ id: '1' }, { id: '2' }];
      mockTypeOrmRepo.find.mockResolvedValue(messages);

      const result = await repository.findAll();
      expect(result).toEqual(messages);
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        relations: ['zApiReturn'],
      });
    });
  });

  describe('updateStatus', () => {
    it('should update message status', async () => {
      await repository.updateStatus('1', MessageStatus.SENT, 'ext-1');
      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('1', { 
        status: MessageStatus.SENT, 
        externalId: 'ext-1' 
      });
    });
  });
});
