import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  IButton,
  IMessengerProvider,
  IOptionSection,
  ISendButtonListOptions,
  ISendDocumentOptions,
  ISendOptionListOptions,
  ISendTextOptions,
} from '../../interfaces/messenger.interface';

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
    this.clientToken =
      this.configService.get<string>('ZAPI_CLIENT_TOKEN') ?? '';

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

  async sendText(
    to: string,
    message: string,
    options?: ISendTextOptions,
  ): Promise<any> {
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
        ...response.data,
      };
    } catch (error) {
      this.logger.error(
        `Error sending text via Z-API: ${error.message}`,
        error.response?.data,
      );
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
        ...response.data,
      };
    } catch (error) {
      this.logger.error(
        `Error sending document via Z-API: ${error.message}`,
        error.response?.data,
      );
      throw error;
    }
  }

  async sendOptionList(
    to: string,
    message: string,
    sections: IOptionSection[],
    options?: ISendOptionListOptions,
  ): Promise<any> {
    const url = `${this.baseUrl}/${this.instanceId}/token/${this.token}/send-option-list`;

    // Z-API structure mapping
    // If multiple sections, we might need to adjust based on Z-API specific capabilities.
    // For now, mapping the first section as 'optionList' root or multiple if supported.
    // Based on prompt typical payload: optionList: { title, rows: [] }
    // We will support single section primarily as per prompt hint, but structured for interface.

    let optionListPayload: any;

    if (sections.length === 1) {
      optionListPayload = {
        title: sections[0].title,
        rows: sections[0].rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
        })),
      };
    } else {
      // Fallback for multiple sections if Z-API supports it (usually 'sections' array instead of 'rows')
      // But adhering to prompt 'typical payload', we might flatten or just pick one.
      // Let's try to map to sections if applicable, or just flatten.
      // WhatsApp API supports 'sections'. Z-API might wrap it.
      // Safe bet: use 'sections' key if multiple, or assume Z-API maps it.
      // However, prompt implies { title, rows }.
      // Let's just take the first section for now to be safe with the prompt description,
      // or if we really need multiple, we'd need to know Z-API spec.
      // I'll implement mapping to `optionList: { title: 'Menu', sections: [...] }` if > 1
      optionListPayload = {
        title: options?.title || 'Menu',
        sections: sections.map((s) => ({
          title: s.title,
          rows: s.rows,
        })),
      };
    }

    const payload = {
      phone: to,
      message,
      title: options?.title,
      footer: options?.footer,
      buttonLabel: options?.buttonLabel || 'Opções',
      optionList: optionListPayload,
    };

    this.logger.log(`Sending option list to ${to} via Z-API`);
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers: this.getHeaders() }),
      );
      return {
        messageId: response.data.messageId,
        zaapId: response.data.zaapId,
        id: response.data.id,
        ...response.data,
      };
    } catch (error) {
      this.logger.error(
        `Error sending option list via Z-API: ${error.message}`,
        error.response?.data,
      );
      throw error;
    }
  }

  async sendButtonList(
    to: string,
    message: string,
    buttons: IButton[],
    options?: ISendButtonListOptions,
  ): Promise<any> {
    const url = `${this.baseUrl}/${this.instanceId}/token/${this.token}/send-button-list`;

    const payload = {
      phone: to,
      message,
      title: options?.title,
      footer: options?.footer,
      buttonList: {
        buttons: buttons.map((btn) => ({
          id: btn.id,
          label: btn.label,
        })),
      },
    };

    this.logger.log(`Sending button list to ${to} via Z-API`);
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers: this.getHeaders() }),
      );
      return {
        messageId: response.data.messageId,
        zaapId: response.data.zaapId,
        id: response.data.id,
        ...response.data,
      };
    } catch (error) {
      this.logger.error(
        `Error sending button list via Z-API: ${error.message}`,
        error.response?.data,
      );
      throw error;
    }
  }
}
