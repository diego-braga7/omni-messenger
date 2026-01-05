import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../enums/message-type.enum';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Boas vindas' })
  name: string;

  @ApiProperty({ example: 'Olá, seja bem vindo!' })
  content: string;

  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  type: MessageType;
}
