import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfessionalDto {
  @ApiProperty({ description: 'Nome do profissional', example: 'Dr. João Silva' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Especialidade', example: 'Cardiologista' })
  @IsNotEmpty()
  @IsString()
  specialty: string;

  @ApiProperty({ description: 'ID do calendário do Google', example: 'primary' })
  @IsNotEmpty()
  @IsString()
  calendarId: string;
}
