import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { RABBITMQ_EVENTS } from '../../common/constants';

@Controller('messenger/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    const rawEnv =
      this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV || 'DEV';
    const normalizedEnv = rawEnv.toUpperCase();

    this.logger.log(
      `Received webhook in environment ${normalizedEnv}: ${JSON.stringify(payload)}`,
    );

    if (normalizedEnv === 'DEV') {
      const scenario = (payload?.scenario || payload?.simulation || 'success')
        .toString()
        .toLowerCase();

      if (scenario === 'error') {
        this.logger.error('DEV webhook simulated error scenario');
        return {
          status: 'error',
          mode: 'DEV',
          scenario: 'error',
          message: 'Simulated webhook error',
        };
      }

      const simulatedPhone =
        payload.phone || payload.from || '5564996064649';

      const simulatedEventData = {
        phone: simulatedPhone,
        text: 'sim',
        type: 'button_response',
        rawPayload: {
          simulated: true,
          selectedOption: 'Sim',
          ...payload,
        },
        contentPayload: {
          selectedButtonId: 'sim',
          label: 'Sim',
        },
      };

      this.logger.log(
        `DEV mode: dispatching simulated webhook event: ${JSON.stringify(
          simulatedEventData,
        )}`,
      );

      await this.rabbitmqService.sendMessage(
        RABBITMQ_EVENTS.MESSAGE_RECEIVED,
        simulatedEventData,
      );

      return {
        status: 'simulated',
        mode: 'DEV',
        scenario: 'success',
        event: simulatedEventData,
      };
    }

    const phone = payload.phone || payload.from;

    let text = '';
    let type = 'text';
    let contentPayload: any = {};

    if (payload.text) {
      text = payload.text.message || payload.text.body || payload.text;
    } else if (payload.listResponseMessage) {
      type = 'list_response';
      text =
        payload.listResponseMessage.title ||
        payload.listResponseMessage.selectedRowId;
      contentPayload = payload.listResponseMessage;
    } else if (payload.buttonsResponseMessage) {
      type = 'button_response';
      text =
        payload.buttonsResponseMessage.selectedButtonId ||
        payload.buttonsResponseMessage.buttonId;
      contentPayload = payload.buttonsResponseMessage;
    }

    const eventData = {
      phone,
      text,
      type,
      rawPayload: payload,
      contentPayload,
    };

    await this.rabbitmqService.sendMessage(
      RABBITMQ_EVENTS.MESSAGE_RECEIVED,
      eventData,
    );

    return { status: 'received' };
  }
}
