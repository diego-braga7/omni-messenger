import { IsArray, IsOptional, IsString, IsNotEmpty } from 'class-validator';
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

  @ApiProperty({ description: 'Conteúdo da mensagem', required: true })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'ID do template (Modelo)', required: false })
  @IsString()
  @IsOptional()
  modelId?: string;
}
