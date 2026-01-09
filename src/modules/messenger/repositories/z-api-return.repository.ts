import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ZApiReturn } from '../entities/z-api-return.entity';

@Injectable()
export class ZApiReturnRepository extends Repository<ZApiReturn> {
  constructor(private dataSource: DataSource) {
    super(ZApiReturn, dataSource.createEntityManager());
  }

  async saveReturn(messageId: string, zaapId: string, id: string): Promise<ZApiReturn> {
    const record = this.create({
      messageId,
      zaapId,
      id,
    });
    return this.save(record);
  }

  async findByMessageId(messageId: string): Promise<ZApiReturn | null> {
    return this.findOne({ where: { messageId } });
  }
}
