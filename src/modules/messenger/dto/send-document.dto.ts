import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class SendDocumentDto {
  @ApiProperty({
    example: '5511999999999',
    description: 'Número do destinatário com DDI e DDD, sem máscara',
  })
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    example: 'https://example.com/file.pdf',
    description:
      'URL ou Base64 do documento (Obrigatório se modelId não for informado)',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    example: 'meu-arquivo',
    description: 'Nome do arquivo (sem extensão) (opcional)',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    example: 'pdf',
    description: 'Extensão do arquivo (ex: pdf, png, docx) (opcional)',
  })
  @IsOptional()
  @IsString()
  extension?: string;

  @ApiPropertyOptional({
    example: 'Segue o documento solicitado',
    description: 'Legenda do documento',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Tempo de espera em segundos antes de enviar',
  })
  @IsOptional()
  @IsNumber()
  delayMessage?: number;

  @ApiPropertyOptional({
    example: 'uuid-do-modelo',
    description: 'ID do modelo de mensagem (obrigatório para novos fluxos)',
  })
  @IsOptional()
  @IsUUID()
  modelId?: string;
}
