import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name);

  @EventPattern('test_message')
  async handleMessage(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`Received message: ${JSON.stringify(data)}`);
    // Manual ack
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}
