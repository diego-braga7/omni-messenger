import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  constructor(@Inject('RABBITMQ_SERVICE') private client: ClientProxy) {}

  async sendMessage(pattern: string, data: any) {
    this.logger.log(`Sending message to ${pattern}: ${JSON.stringify(data)}`);
    return this.client.emit(pattern, data);
  }
}
