import { Controller, Post, Body, Inject, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessengerService } from './services/messenger.service';
import { SendTextDto } from './dto/send-text.dto';
import { SendDocumentDto } from './dto/send-document.dto';

@ApiTags('Messenger')
@Controller('messenger')
export class MessengerController {
  constructor(private readonly messengerService: MessengerService) {}

  @Post('text')
  @ApiOperation({ summary: 'Enviar mensagem de texto (Assíncrono)' })
  @ApiResponse({ status: 202, description: 'Mensagem enfileirada para envio' })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendText(@Body() dto: SendTextDto) {
    return this.messengerService.sendText(dto);
  }

  @Post('document')
  @ApiOperation({ summary: 'Enviar documento (Assíncrono)' })
  @ApiResponse({ status: 202, description: 'Documento enfileirado para envio' })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendDocument(@Body() dto: SendDocumentDto) {
    return this.messengerService.sendDocument(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Listar histórico de mensagens' })
  async getHistory() {
    return this.messengerService.findAll();
  }
}
