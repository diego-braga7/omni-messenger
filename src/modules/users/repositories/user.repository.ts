import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly typeOrmRepo: Repository<User>,
  ) {}

  async findByIds(ids: string[]): Promise<User[]> {
    return this.typeOrmRepo.findBy({ id: In(ids) });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.typeOrmRepo.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.typeOrmRepo.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.typeOrmRepo.find();
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.typeOrmRepo.create(data);
    return this.typeOrmRepo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.typeOrmRepo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.typeOrmRepo.softDelete(id);
  }

  async findOrCreate(phone: string, data?: Partial<User>): Promise<User> {
    let user = await this.findByPhone(phone);
    if (!user) {
      user = await this.create({ phone, ...data });
    }
    return user;
  }
}
