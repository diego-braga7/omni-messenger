import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto: CreateUserDto = { phone: '123' };
      mockRepo.create.mockResolvedValue({ id: '1', ...dto });
      expect(await service.create(dto)).toEqual({ id: '1', ...dto });
    });
  });

  describe('findAll', () => {
    it('should return users', async () => {
      mockRepo.findAll.mockResolvedValue([]);
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should find one user', async () => {
      mockRepo.findById.mockResolvedValue({ id: '1' });
      expect(await service.findOne('1')).toEqual({ id: '1' });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const dto: UpdateUserDto = { name: 'New' };
      mockRepo.update.mockResolvedValue({ id: '1', ...dto });
      expect(await service.update('1', dto)).toEqual({ id: '1', ...dto });
    });
  });

  describe('remove', () => {
    it('should remove user', async () => {
      mockRepo.softDelete.mockResolvedValue(undefined);
      await service.remove('1');
      expect(mockRepo.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
