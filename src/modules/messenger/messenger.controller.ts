import { Controller, Post, Body, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IMessengerProvider } from './interfaces/messenger.interface';
import { MESSENGER_PROVIDER } from './messenger.module';
import { SendTextDto } from './dto/send-text.dto';
import { SendDocumentDto } from './dto/send-document.dto';

@ApiTags('Messenger')
@Controller('messenger')
export class MessengerController {
  constructor(
    @Inject(MESSENGER_PROVIDER) private readonly messengerProvider: IMessengerProvider,
  ) {}

  @Post('text')
  @ApiOperation({ summary: 'Enviar mensagem de texto simples' })
  @ApiResponse({ status: 200, description: 'Mensagem enviada com sucesso' })
  @HttpCode(HttpStatus.OK)
  async sendText(@Body() dto: SendTextDto) {
    return this.messengerProvider.sendText(dto.phone, dto.message, {
      delayMessage: dto.delayMessage,
      delayTyping: dto.delayTyping,
    });
  }

  @Post('document')
  @ApiOperation({ summary: 'Enviar documento (PDF, Imagem, etc)' })
  @ApiResponse({ status: 200, description: 'Documento enviado com sucesso' })
  @HttpCode(HttpStatus.OK)
  async sendDocument(@Body() dto: SendDocumentDto) {
    return this.messengerProvider.sendDocument(
      dto.phone,
      dto.document,
      dto.fileName,
      dto.extension,
      {
        caption: dto.caption,
        delayMessage: dto.delayMessage,
      },
    );
  }
}
