import { Injectable, Inject, Logger } from '@nestjs/common';
import { MessageRepository } from '../repositories/message.repository';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';
import { SendTextDto } from '../dto/send-text.dto';
import { SendDocumentDto } from '../dto/send-document.dto';
import { MessageType } from '../enums/message-type.enum';
import { MessageStatus } from '../enums/message-status.enum';
import { MESSENGER_PROVIDER } from '../messenger.constants';
import { IMessengerProvider } from '../interfaces/messenger.interface';

@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);

  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly rabbitmqService: RabbitmqService,
    @Inject(MESSENGER_PROVIDER)
    private readonly provider: IMessengerProvider,
  ) {}

  async sendText(dto: SendTextDto) {
    const message = await this.messageRepo.create({
      to: dto.phone,
      content: dto.message,
      type: MessageType.TEXT,
      status: MessageStatus.PENDING,
    });

    await this.rabbitmqService.sendMessage('process_message', { messageId: message.id });
    
    // Update to queued immediately after emitting? Or wait? 
    // Let's assume queued if emit succeeds.
    await this.messageRepo.updateStatus(message.id, MessageStatus.QUEUED);

    return message;
  }

  async sendDocument(dto: SendDocumentDto) {
    const message = await this.messageRepo.create({
      to: dto.phone,
      content: dto.document,
      type: MessageType.DOCUMENT,
      fileName: dto.fileName,
      extension: dto.extension,
      caption: dto.caption,
      status: MessageStatus.PENDING,
    });

    await this.rabbitmqService.sendMessage('process_message', { messageId: message.id });
    await this.messageRepo.updateStatus(message.id, MessageStatus.QUEUED);

    return message;
  }

  async processMessage(messageId: string) {
    this.logger.log(`Processing message ${messageId}`);
    const message = await this.messageRepo.findById(messageId);
    
    if (!message) {
      this.logger.error(`Message ${messageId} not found`);
      return;
    }

    if (message.status === MessageStatus.SENT) {
      this.logger.warn(`Message ${messageId} already sent`);
      return;
    }

    try {
      let result;
      if (message.type === MessageType.TEXT) {
        result = await this.provider.sendText(message.to, message.content);
      } else {
        result = await this.provider.sendDocument(
          message.to,
          message.content,
          message.fileName || 'file',
          message.extension || 'txt',
          { caption: message.caption }
        );
      }

      await this.messageRepo.updateStatus(
        message.id, 
        MessageStatus.SENT, 
        result?.messageId || 'external-id-placeholder'
      );
      this.logger.log(`Message ${messageId} sent successfully`);
    } catch (error) {
      this.logger.error(`Failed to send message ${messageId}`, error);
      await this.messageRepo.updateStatus(message.id, MessageStatus.FAILED);
    }
  }

  async findAll() {
    return this.messageRepo.findAll();
  }
}
