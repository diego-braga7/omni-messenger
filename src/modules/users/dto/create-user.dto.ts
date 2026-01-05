import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Telefone do usuário', required: true })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Email do usuário', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;
}
