import { Controller, Post, Body, Inject, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MessengerService } from './services/messenger.service';
import { SendTextDto } from './dto/send-text.dto';
import { SendDocumentDto } from './dto/send-document.dto';
import { BulkSendDto } from './dto/bulk-send.dto';

@ApiTags('Messenger')
@Controller('messenger')
export class MessengerController {
  constructor(private readonly messengerService: MessengerService) {}

  @Post('text')
  @ApiOperation({ summary: 'Enviar mensagem de texto (Assíncrono)' })
  @ApiResponse({ status: 202, description: 'Mensagem enfileirada para envio' })
  @ApiResponse({ status: 400, description: 'Erro de validação (ex: template incompatível)' })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendText(@Body() dto: SendTextDto) {
    return this.messengerService.sendText(dto);
  }

  @Post('document')
  @ApiOperation({ summary: 'Enviar documento (Assíncrono)' })
  @ApiResponse({ status: 202, description: 'Documento enfileirado para envio' })
  @ApiResponse({ status: 400, description: 'Erro de validação (ex: template incompatível)' })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendDocument(@Body() dto: SendDocumentDto) {
    return this.messengerService.sendDocument(dto);
  }

  @Post('bulk-send')
  @ApiOperation({ summary: 'Envio em massa com rate limiting (30 msgs/10s)' })
  @ApiResponse({ status: 202, description: 'Envio em massa iniciado' })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBody({
    type: BulkSendDto,
    examples: {
      default: {
        summary: 'Exemplo básico',
        value: {
          phones: ['5511999999999', '5511988888888'],
          userIds: ['uuid-user-1', 'uuid-user-2'],
          message: 'Olá, esta é uma mensagem em massa!',
          modelId: 'optional-model-uuid'
        }
      }
    }
  })
  async sendBulk(@Body() dto: BulkSendDto) {
    return this.messengerService.sendBulk(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Listar histórico de mensagens' })
  async getHistory() {
    return this.messengerService.findAll();
  }
}
