import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly typeOrmRepo: Repository<User>,
  ) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.typeOrmRepo.findOne({ where: { phone } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.typeOrmRepo.create(data);
    return this.typeOrmRepo.save(user);
  }

  async findOrCreate(phone: string, data?: Partial<User>): Promise<User> {
    let user = await this.findByPhone(phone);
    if (!user) {
      user = await this.create({ phone, ...data });
    }
    return user;
  }
}
