import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { RABBITMQ_EVENTS } from '../../common/constants';

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name);

  @EventPattern(RABBITMQ_EVENTS.TEST_MESSAGE)
  async handleMessage(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`Received message: ${JSON.stringify(data)}`);
    // Manual ack
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}
