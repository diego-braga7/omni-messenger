import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfessionalsService } from '../services/professionals.service';
import { CreateProfessionalDto } from '../dtos/create-professional.dto';
import { UpdateProfessionalDto } from '../dtos/update-professional.dto';

@ApiTags('Professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo profissional' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Profissional criado com sucesso.',
  })
  create(@Body() createProfessionalDto: CreateProfessionalDto) {
    return this.professionalsService.create(createProfessionalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os profissionais' })
  findAll() {
    return this.professionalsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um profissional pelo ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profissional encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profissional não encontrado.',
  })
  findOne(@Param('id') id: string) {
    return this.professionalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um profissional' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profissional atualizado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profissional não encontrado.',
  })
  update(
    @Param('id') id: string,
    @Body() updateProfessionalDto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.update(id, updateProfessionalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover (soft delete) um profissional' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Profissional removido e agendamentos cancelados.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profissional não encontrado.',
  })
  remove(@Param('id') id: string) {
    return this.professionalsService.remove(id);
  }
}
