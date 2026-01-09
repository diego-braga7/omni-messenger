import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IMessengerProvider, ISendDocumentOptions, ISendTextOptions } from '../../interfaces/messenger.interface';

@Injectable()
export class ZApiProvider implements IMessengerProvider {
  private readonly logger = new Logger(ZApiProvider.name);
  private readonly instanceId: string;
  private readonly token: string;
  private readonly baseUrl = 'https://api.z-api.io/instances';
  private readonly clientToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.instanceId = this.configService.get<string>('ZAPI_INSTANCE_ID') ?? '';
    this.token = this.configService.get<string>('ZAPI_TOKEN') ?? '';
    this.clientToken = this.configService.get<string>('ZAPI_CLIENT_TOKEN') ?? '';

    if (!this.instanceId || !this.token || !this.clientToken) {
      this.logger.warn('Z-API credentials not fully configured');
    }
  }

  private getHeaders() {
    return {
      'Client-Token': this.clientToken,
      'Content-Type': 'application/json',
    };
  }

  async sendText(to: string, message: string, options?: ISendTextOptions): Promise<any> {
    const url = `${this.baseUrl}/${this.instanceId}/token/${this.token}/send-text`;
    const payload = {
      phone: to,
      message,
      delayMessage: options?.delayMessage,
      delayTyping: options?.delayTyping,
    };

    this.logger.log(`Sending text to ${to} via Z-API`);
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers: this.getHeaders() }),
      );
      return {
        messageId: response.data.messageId,
        zaapId: response.data.zaapId,
        id: response.data.id,
        ...response.data
      };
    } catch (error) {
      this.logger.error(`Error sending text via Z-API: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async sendDocument(
    to: string,
    documentUrl: string,
    fileName: string,
    extension: string,
    options?: ISendDocumentOptions,
  ): Promise<any> {
    // A Z-API usa o {extension} na URL
    const url = `${this.baseUrl}/${this.instanceId}/token/${this.token}/send-document/${extension}`;
    const payload = {
      phone: to,
      document: documentUrl,
      fileName,
      caption: options?.caption,
      delayMessage: options?.delayMessage,
    };

    this.logger.log(`Sending document to ${to} via Z-API`);
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers: this.getHeaders() }),
      );
      return {
        messageId: response.data.messageId,
        zaapId: response.data.zaapId,
        id: response.data.id,
        ...response.data
      };
    } catch (error) {
      this.logger.error(`Error sending document via Z-API: ${error.message}`, error.response?.data);
      throw error;
    }
  }
}
