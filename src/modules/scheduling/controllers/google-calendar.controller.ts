import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Professional } from '../entities/professional.entity';
import { Repository } from 'typeorm';
import { Response } from 'express';

@ApiTags('Google Calendar Auth')
@Controller('auth/google-calendar')
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name);

  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    @InjectRepository(Professional)
    private readonly professionalRepo: Repository<Professional>,
  ) {}

  @Get('auth/:professionalId')
  @ApiOperation({ summary: 'Iniciar autenticação OAuth2 com Google Calendar' })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para a página de login do Google',
  })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  async auth(
    @Param('professionalId') professionalId: string,
    @Res() res: Response,
  ) {
    const professional = await this.professionalRepo.findOne({
      where: { id: professionalId },
    });
    if (!professional) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Professional not found' });
    }

    const url = this.googleCalendarService.generateAuthUrl(professionalId);
    return res.redirect(url);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback do OAuth2 do Google' })
  @ApiResponse({
    status: 200,
    description: 'Autenticação realizada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Código ou estado ausente' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno na autenticação' })
  async callback(
    @Query('code') code: string,
    @Query('state') professionalId: string,
    @Res() res: Response,
  ) {
    if (!code || !professionalId) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Missing code or state' });
    }

    try {
      const tokens = await this.googleCalendarService.getTokens(code);

      const professional = await this.professionalRepo.findOne({
        where: { id: professionalId },
      });
      if (!professional) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Professional not found' });
      }

      professional.googleAccessToken = tokens.access_token ?? null;
      professional.googleRefreshToken = tokens.refresh_token ?? null;
      professional.googleTokenExpiry = tokens.expiry_date ?? null;

      await this.professionalRepo.save(professional);

      return res
        .status(HttpStatus.OK)
        .json({ message: 'Google Calendar authentication successful' });
    } catch (error) {
      this.logger.error(
        `Error in Google Callback: ${error.message}`,
        error.stack,
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Authentication failed' });
    }
  }
}
