import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendTextDto {
  @ApiProperty({ example: '5511999999999', description: 'Número do destinatário com DDI e DDD, sem máscara' })
  phone: string;

  @ApiProperty({ example: 'Olá, mundo!', description: 'Mensagem de texto a ser enviada' })
  message: string;

  @ApiPropertyOptional({ example: 1, description: 'Tempo de espera em segundos antes de enviar' })
  delayMessage?: number;

  @ApiPropertyOptional({ example: 1, description: 'Tempo em segundos que aparecerá "Digitando..."' })
  delayTyping?: number;
}
