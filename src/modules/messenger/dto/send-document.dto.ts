import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendDocumentDto {
  @ApiProperty({
    example: '5511999999999',
    description: 'Número do destinatário com DDI e DDD, sem máscara',
  })
  phone: string;

  @ApiProperty({
    example: 'https://example.com/file.pdf',
    description: 'URL ou Base64 do documento',
  })
  document: string;

  @ApiProperty({
    example: 'meu-arquivo',
    description: 'Nome do arquivo (sem extensão)',
  })
  fileName: string;

  @ApiProperty({
    example: 'pdf',
    description: 'Extensão do arquivo (ex: pdf, png, docx)',
  })
  extension: string;

  @ApiPropertyOptional({
    example: 'Segue o documento solicitado',
    description: 'Legenda do documento',
  })
  caption?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Tempo de espera em segundos antes de enviar',
  })
  delayMessage?: number;

  @ApiPropertyOptional({
    example: 'uuid-do-modelo',
    description: 'ID do modelo de mensagem (obrigatório para novos fluxos)',
  })
  modelId?: string;
}
