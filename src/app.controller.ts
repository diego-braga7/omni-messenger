import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RabbitmqService } from './modules/rabbitmq/rabbitmq.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-mq')
  async testMq(): Promise<string> {
    await this.rabbitmqService.sendMessage('test_message', {
      hello: 'world',
      time: new Date().toISOString(),
    });
    return 'Message sent to RabbitMQ';
  }
}
