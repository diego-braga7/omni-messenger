import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkSendDto {
  @ApiProperty({
    description: 'Lista de números de telefone',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  phones?: string[];

  @ApiProperty({
    description: 'Lista de IDs de usuários',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];

  @ApiProperty({
    description: 'Conteúdo da mensagem (Texto ou Legenda do Documento)',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    description: 'URL ou Base64 do documento',
    required: false,
  })
  @IsString()
  @IsOptional()
  document?: string;

  @ApiProperty({
    description: 'Nome do arquivo (sem extensão)',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiProperty({
    description: 'Extensão do arquivo (ex: pdf, png)',
    required: false,
  })
  @IsString()
  @IsOptional()
  extension?: string;

  @ApiProperty({ description: 'ID do template (Modelo)', required: false })
  @IsString()
  @IsOptional()
  modelId?: string;
}
