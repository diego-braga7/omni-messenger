import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { RABBITMQ_EVENTS } from '../../common/constants';

@Controller('messenger/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    this.logger.log(`Received webhook: ${JSON.stringify(payload)}`);

    // Basic validation/extraction logic could go here
    // For now, we forward the raw payload to RabbitMQ
    // We might want to extract key fields to make it easier for consumers
    
    // Attempt to extract phone and text/type for logging/routing
    const phone = payload.phone || payload.from; // Adjust based on actual Z-API payload
    
    // Identify message type and content
    let text = '';
    let type = 'text';
    let contentPayload: any = {};

    if (payload.text) {
      text = payload.text.message || payload.text.body || payload.text;
    } else if (payload.listResponseMessage) {
      type = 'list_response';
      text = payload.listResponseMessage.title || payload.listResponseMessage.selectedRowId;
      contentPayload = payload.listResponseMessage;
    } else if (payload.buttonsResponseMessage) {
      type = 'button_response';
      text = payload.buttonsResponseMessage.selectedButtonId || payload.buttonsResponseMessage.buttonId;
      contentPayload = payload.buttonsResponseMessage;
    }

    const eventData = {
      phone,
      text,
      type,
      rawPayload: payload,
      contentPayload
    };

    await this.rabbitmqService.sendMessage(RABBITMQ_EVENTS.MESSAGE_RECEIVED, eventData);

    return { status: 'received' };
  }
}
