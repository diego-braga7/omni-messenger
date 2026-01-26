import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { RABBITMQ_EVENTS } from '../../common/constants';
import { SchedulingService } from './services/scheduling.service';

@Controller()
export class SchedulingConsumer {
  private readonly logger = new Logger(SchedulingConsumer.name);

  constructor(private readonly schedulingService: SchedulingService) {}

  @EventPattern(RABBITMQ_EVENTS.MESSAGE_RECEIVED)
  async handleMessageReceived(
    @Payload() data: { phone: string; text: string; type: string; rawPayload: any; contentPayload: any },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`Processing incoming message from ${data.phone}`);

    try {
      await this.schedulingService.handleMessage(
        data.phone,
        data.text,
        data.type,
        data.contentPayload
      );
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
      // Depending on error, we might want to requeue or dead letter.
      // For now, ack to prevent infinite loops on logic errors.
      channel.ack(originalMsg);
    }
  }
}
