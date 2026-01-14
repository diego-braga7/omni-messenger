import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../enums/message-type.enum';
import {
  IsString,
  IsEnum,
  IsNotEmpty,
  ValidateIf,
  Matches,
} from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Boas vindas' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Olá, seja bem vindo!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiPropertyOptional({
    example: 'meu-arquivo',
    description:
      'Nome do arquivo (sem extensão). Opcional para templates DOCUMENT.',
  })
  @ValidateIf(
    (o) => o.type === MessageType.DOCUMENT && o.filename !== undefined,
  )
  @IsString()
  @Matches(/^[^\/\\:*?"<>|]{1,255}$/)
  filename?: string;

  @ApiPropertyOptional({
    example: 'pdf',
    description: 'Obrigatório se type for DOCUMENT',
  })
  @ValidateIf((o) => o.type === MessageType.DOCUMENT)
  @IsString()
  @IsNotEmpty()
  extension?: string;
}
