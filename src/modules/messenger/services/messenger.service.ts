import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { MessageRepository } from '../repositories/message.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { MessageTemplateRepository } from '../repositories/message-template.repository';
import { ZApiReturnRepository } from '../repositories/z-api-return.repository';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';
import { SendTextDto } from '../dto/send-text.dto';
import { SendDocumentDto } from '../dto/send-document.dto';
import { BulkSendDto } from '../dto/bulk-send.dto';
import { MessageType } from '../enums/message-type.enum';
import { MessageStatus } from '../enums/message-status.enum';
import { MESSENGER_PROVIDER } from '../messenger.constants';
import { IMessengerProvider } from '../interfaces/messenger.interface';

@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);

  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly userRepo: UserRepository,
    private readonly templateRepo: MessageTemplateRepository,
    private readonly zApiReturnRepo: ZApiReturnRepository,
    private readonly rabbitmqService: RabbitmqService,
    @Inject(MESSENGER_PROVIDER)
    private readonly provider: IMessengerProvider,
  ) {}

  async sendText(dto: SendTextDto) {
    // 1. Find or Create User
    const user = await this.userRepo.findOrCreate(dto.phone);

    // 2. Validate Template if provided
    if (dto.modelId) {
      const template = await this.templateRepo.findById(dto.modelId);
      if (!template) {
        throw new BadRequestException('Template not found');
      }
      if (template.type !== MessageType.TEXT) {
        throw new BadRequestException('Template type mismatch. Expected TEXT.');
      }
    }

    const message = await this.messageRepo.create({
      to: dto.phone,
      content: dto.message,
      type: MessageType.TEXT,
      status: MessageStatus.PENDING,
      userId: user.id,
      templateId: dto.modelId,
    });

    await this.rabbitmqService.sendMessage('process_message', {
      messageId: message.id,
    });

    // Update to queued immediately after emitting? Or wait?
    // Let's assume queued if emit succeeds.
    await this.messageRepo.updateStatus(message.id, MessageStatus.QUEUED);

    return message;
  }

  async sendDocument(dto: SendDocumentDto) {
    // 1. Find or Create User
    const user = await this.userRepo.findOrCreate(dto.phone);

    let documentContent = dto.document;
    let extension = dto.extension;
    let fileName = dto.fileName;

    // 2. Validate Template if provided
    if (dto.modelId) {
      const template = await this.templateRepo.findById(dto.modelId);
      if (!template) {
        throw new BadRequestException('Template not found');
      }
      if (template.type !== MessageType.DOCUMENT) {
        throw new BadRequestException(
          'Template type mismatch. Expected DOCUMENT.',
        );
      }
      // If document not provided in DTO, use from template
      if (!documentContent) {
        documentContent = template.content;
      }
      // If extension not provided in DTO, use from template
      if (!extension) {
        extension = template.extension;
      }
      if (!fileName && (template as any).filename) {
        fileName = (template as any).filename;
      }
    }

    if (!documentContent) {
      throw new BadRequestException('Document content is required');
    }

    if (!extension) {
      throw new BadRequestException('Extension is required');
    }

    const message = await this.messageRepo.create({
      to: dto.phone,
      content: documentContent,
      type: MessageType.DOCUMENT,
      fileName: fileName || 'document',
      extension: extension,
      caption: dto.caption,
      status: MessageStatus.PENDING,
      userId: user.id,
      templateId: dto.modelId,
    });

    await this.rabbitmqService.sendMessage('process_message', {
      messageId: message.id,
    });
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
          { caption: message.caption },
        );
      }

      await this.messageRepo.updateStatus(
        message.id,
        MessageStatus.SENT,
        result?.id || result?.messageId || 'external-id-placeholder',
      );

      if (result?.zaapId && result?.id) {
        await this.zApiReturnRepo.saveReturn(
          message.id,
          result.zaapId,
          result.id,
        );
      } else {
        this.logger.warn(
          `Z-API response missing zaapId or id for message ${message.id}`,
          result,
        );
      }

      this.logger.log(`Message ${messageId} sent successfully`);
    } catch (error) {
      this.logger.error(`Failed to send message ${messageId}`, error);
      await this.messageRepo.updateStatus(message.id, MessageStatus.FAILED);
    }
  }

  async sendBulk(dto: BulkSendDto) {
    const phones = new Set<string>();
    if (dto.phones) dto.phones.forEach((p) => phones.add(p));
    if (dto.userIds && dto.userIds.length > 0) {
      const users = await this.userRepo.findByIds(dto.userIds);
      users.forEach((u) => phones.add(u.phone));
    }

    const phoneList = Array.from(phones);
    const chunks = this.chunkArray(phoneList, 30);

    this.logger.log(
      `Starting bulk send: ${phoneList.length} messages in ${chunks.length} batches.`,
    );

    chunks.forEach((chunk, index) => {
      setTimeout(async () => {
        this.logger.log(`Processing bulk batch ${index + 1}/${chunks.length}`);
        for (const phone of chunk) {
          try {
            // We use sendText directly. It queues the message.
            await this.sendText({
              phone,
              message: dto.message,
              modelId: dto.modelId,
            });
          } catch (e) {
            this.logger.error(`Failed to queue bulk message to ${phone}`, e);
          }
        }
      }, index * 10000); // 10 seconds interval
    });

    return {
      message: 'Bulk send initiated',
      total: phoneList.length,
      batches: chunks.length,
      estimatedTimeSeconds: chunks.length * 10,
    };
  }

  private chunkArray(array: any[], size: number) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  async findAll() {
    return this.messageRepo.findAll();
  }

  async findOne(id: string) {
    const message = await this.messageRepo.findById(id);
    if (!message) {
      throw new BadRequestException('Message not found');
    }
    return message;
  }
}
