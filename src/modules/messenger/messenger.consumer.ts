import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { MessengerService } from './services/messenger.service';
import { RABBITMQ_EVENTS } from '../../common/constants';

@Controller()
export class MessengerConsumer {
  private readonly logger = new Logger(MessengerConsumer.name);

  constructor(private readonly messengerService: MessengerService) {}

  @EventPattern(RABBITMQ_EVENTS.PROCESS_MESSAGE)
  async handleProcessMessage(
    @Payload() data: { messageId: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Received message to process: ${JSON.stringify(data)}`);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.messengerService.processMessage(data.messageId);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing message ${data.messageId}: ${error.message}`, error.stack);
      // Requeue or dead letter logic could go here
      // For now, we ack to avoid infinite loops if it's a permanent error,
      // or nack if we want to retry.
      // Since the service handles errors by setting status=FAILED, we ack.
      channel.ack(originalMsg);
    }
  }
}
