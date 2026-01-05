import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { MessengerService } from './services/messenger.service';

@Controller()
export class MessengerConsumer {
  constructor(private readonly messengerService: MessengerService) {}

  @EventPattern('process_message')
  async handleProcessMessage(@Payload() data: { messageId: string }, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.messengerService.processMessage(data.messageId);
      channel.ack(originalMsg);
    } catch (error) {
      // Requeue or dead letter logic could go here
      // For now, we ack to avoid infinite loops if it's a permanent error, 
      // or nack if we want to retry.
      // Since the service handles errors by setting status=FAILED, we ack.
      channel.ack(originalMsg);
    }
  }
}
