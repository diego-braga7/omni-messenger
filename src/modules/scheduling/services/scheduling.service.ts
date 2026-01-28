import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ConversationState } from '../entities/conversation-state.entity';
import { Service } from '../entities/service.entity';
import { Professional } from '../entities/professional.entity';
import { Appointment } from '../entities/appointment.entity';
import { GoogleCalendarService } from './google-calendar.service';
import { ConversationStep } from '../enums/conversation-step.enum';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { MESSENGER_PROVIDER } from '../../messenger/messenger.constants';
import { IMessengerProvider } from '../../messenger/interfaces/messenger.interface';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    @InjectRepository(ConversationState)
    private readonly stateRepo: Repository<ConversationState>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Professional)
    private readonly professionalRepo: Repository<Professional>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly googleCalendarService: GoogleCalendarService,
    @Inject(MESSENGER_PROVIDER)
    private readonly messengerProvider: IMessengerProvider,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async handleMessage(
    phone: string,
    text: string,
    type: string,
    payload?: any,
  ) {
    this.logger.log(`Handling message from ${phone}: ${text} (${type})`);

    const user = await this.usersService.findOrCreate(phone);

    const state = await this.stateRepo.findOne({ where: { phone } });

    const normalizedText = text?.toLowerCase() || '';

    if (normalizedText === 'cancelar') {
      if (state) {
        await this.stateRepo.delete(phone);
        await this.messengerProvider.sendText(
          phone,
          'Agendamento cancelado. Quando quiser, é só chamar!',
        );
      } else {
        await this.messengerProvider.sendText(
          phone,
          'Não há agendamento em andamento.',
        );
      }
      return;
    }

    const isStartSchedulingIntent =
      normalizedText.includes('agendar') || normalizedText.includes('marcar');

    const isButtonYes =
      type === 'button_response' &&
      (normalizedText === 'sim' ||
        payload?.label?.toLowerCase() === 'sim' ||
        payload?.selectedButtonId === 'sim');

    if (!state) {
      if (isStartSchedulingIntent || isButtonYes) {
        await this.startScheduling(phone);
      }
      return;
    }

    // State Machine
    try {
      switch (state.step) {
        case ConversationStep.SELECT_SERVICE:
          await this.handleSelectService(state, text, payload);
          break;
        case ConversationStep.SELECT_PROFESSIONAL:
          await this.handleSelectProfessional(state, text, payload);
          break;
        case ConversationStep.SELECT_DATE:
          await this.handleSelectDate(state, text);
          break;
        case ConversationStep.SELECT_TIME:
          await this.handleSelectTime(state, text, payload, user.id);
          break;
        default:
          this.logger.warn(`Unknown step ${state.step} for ${phone}`);
      }
    } catch (error) {
      this.logger.error(
        `Error in scheduling flow: ${error.message}`,
        error.stack,
      );
      await this.messengerProvider.sendText(
        phone,
        'Desculpe, ocorreu um erro. Por favor, tente novamente digitando "cancelar" e recomeçando.',
      );
    }
  }

  private async startScheduling(phone: string) {
    const services = await this.serviceRepo.find();

    if (services.length === 0) {
      await this.messengerProvider.sendText(
        phone,
        'Desculpe, não temos serviços disponíveis no momento.',
      );
      return;
    }

    await this.stateRepo.save({
      phone,
      step: ConversationStep.SELECT_SERVICE,
      data: {},
    });

    // Send services list
    const rows = services.map((s) => ({
      id: s.id,
      title: s.name,
      description: `R$ ${s.price || 'Sob consulta'} - ${s.durationMinutes} min`,
    }));

    await this.messengerProvider.sendOptionList(
      phone,
      'Olá! Vamos agendar. Escolha um serviço:',
      [{ title: 'Serviços', rows }],
      { title: 'Agendamento', buttonLabel: 'Ver Serviços' },
    );

    const rawEnv = this.configService.get<string>('NODE_ENV') || 'DEV';
    const normalizedEnv = rawEnv.toUpperCase();

    if (normalizedEnv === 'DEV' && phone === '5564996064649') {
      await this.messengerProvider.sendButtonList(
        phone,
        'Mensagem de teste do fluxo de agendamento. Confirma o agendamento?',
        [
          { id: 'sim', label: 'Sim' },
          { id: 'nao', label: 'Não' },
        ],
        {
          title: 'Confirmação',
          footer: 'Fluxo de agendamento (DEV)',
        },
      );
    }
  }

  private async handleSelectService(
    state: ConversationState,
    text: string,
    payload?: any,
  ) {
    // Expecting ID from list selection
    const serviceId = payload?.selectedRowId || text; // Fallback to text if typed ID (unlikely)

    const service = await this.serviceRepo.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      await this.messengerProvider.sendText(
        state.phone,
        'Serviço inválido. Por favor, selecione uma opção da lista.',
      );
      return;
    }

    // Update state
    state.step = ConversationStep.SELECT_PROFESSIONAL;
    state.data = { ...state.data, serviceId: service.id };
    await this.stateRepo.save(state);

    // Get professionals
    const professionals = await this.professionalRepo.find();

    const rows = professionals.map((p) => ({
      id: p.id,
      title: p.name,
      description: p.specialty,
    }));

    await this.messengerProvider.sendOptionList(
      state.phone,
      `Você escolheu ${service.name}. Agora escolha um profissional:`,
      [{ title: 'Profissionais', rows }],
      { title: 'Profissionais', buttonLabel: 'Ver Profissionais' },
    );
  }

  private async handleSelectProfessional(
    state: ConversationState,
    text: string,
    payload?: any,
  ) {
    const professionalId = payload?.selectedRowId || text;

    const professional = await this.professionalRepo.findOne({
      where: { id: professionalId },
    });

    if (!professional) {
      await this.messengerProvider.sendText(
        state.phone,
        'Profissional inválido. Por favor, selecione uma opção da lista.',
      );
      return;
    }

    // Update state
    state.step = ConversationStep.SELECT_DATE;
    state.data = { ...state.data, professionalId: professional.id };
    await this.stateRepo.save(state);

    await this.messengerProvider.sendText(
      state.phone,
      `Certo, com ${professional.name}. Por favor, digite a data desejada (ex: 25/10/2023 ou amanhã):`,
    );
  }

  private async handleSelectDate(state: ConversationState, text: string) {
    const date = this.parseDate(text);

    if (!date || isNaN(date.getTime())) {
      await this.messengerProvider.sendText(
        state.phone,
        'Data inválida. Use o formato DD/MM/AAAA ou "hoje"/"amanhã".',
      );
      return;
    }

    if (date < new Date()) {
      // Allow today if checking time later, but simple check for now
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        await this.messengerProvider.sendText(
          state.phone,
          'A data deve ser futura. Tente novamente.',
        );
        return;
      }
    }

    // Update state
    state.step = ConversationStep.SELECT_TIME;
    state.data = { ...state.data, date: date.toISOString().split('T')[0] }; // Store YYYY-MM-DD
    await this.stateRepo.save(state);

    // Check availability
    const professional = await this.professionalRepo.findOne({
      where: { id: state.data.professionalId },
    });

    if (!professional || !professional.calendarId) {
      await this.messengerProvider.sendText(
        state.phone,
        'Erro ao buscar agenda do profissional.',
      );
      // Maybe reset or fallback
      return;
    }

    // Define search range (e.g., 8am to 6pm of selected date)
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0);

    const freeSlots = await this.googleCalendarService.checkAvailability(
      professional,
      startOfDay,
      endOfDay,
    );

    if (freeSlots.length === 0) {
      await this.messengerProvider.sendText(
        state.phone,
        'Não há horários livres nesta data. Por favor, digite outra data:',
      );
      // Revert step
      state.step = ConversationStep.SELECT_DATE;
      await this.stateRepo.save(state);
      return;
    }

    // Generate slots (e.g., every 1 hour or based on service duration)
    // For simplicity, let's use the freeSlots directly or chop them.
    // Assuming service duration is needed.
    const service = await this.serviceRepo.findOne({
      where: { id: state.data.serviceId },
    });
    if (!service) {
      await this.messengerProvider.sendText(
        state.phone,
        'Erro: Serviço não encontrado.',
      );
      await this.stateRepo.delete(state.phone);
      return;
    }
    const duration = service.durationMinutes || 60;

    const availableTimes = this.generateTimeSlots(freeSlots, duration);

    if (availableTimes.length === 0) {
      await this.messengerProvider.sendText(
        state.phone,
        'Não há horários suficientes para este serviço nesta data. Tente outra data.',
      );
      state.step = ConversationStep.SELECT_DATE;
      await this.stateRepo.save(state);
      return;
    }

    // Limit options (WhatsApp limitation)
    const options = availableTimes.slice(0, 10).map((time) => ({
      id: time,
      title: time,
    }));

    await this.messengerProvider.sendOptionList(
      state.phone,
      'Horários disponíveis:',
      [{ title: 'Manhã/Tarde', rows: options }],
      { title: 'Horários', buttonLabel: 'Ver Horários' },
    );
  }

  private async handleSelectTime(
    state: ConversationState,
    text: string,
    payload: any,
    userId: string,
  ) {
    const time = payload?.selectedRowId || text;

    // Validate time format HH:mm
    if (!/^\d{2}:\d{2}$/.test(time)) {
      await this.messengerProvider.sendText(
        state.phone,
        'Horário inválido. Selecione da lista.',
      );
      return;
    }

    const dateStr = state.data.date; // YYYY-MM-DD
    const startDateTime = new Date(`${dateStr}T${time}:00`);

    // Calculate end time
    const service = await this.serviceRepo.findOne({
      where: { id: state.data.serviceId },
    });
    if (!service) {
      await this.messengerProvider.sendText(
        state.phone,
        'Erro: Serviço não encontrado.',
      );
      await this.stateRepo.delete(state.phone);
      return;
    }
    const duration = service.durationMinutes || 60;
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    const professional = await this.professionalRepo.findOne({
      where: { id: state.data.professionalId },
    });
    if (!professional) {
      await this.messengerProvider.sendText(
        state.phone,
        'Erro: Profissional não encontrado.',
      );
      await this.stateRepo.delete(state.phone);
      return;
    }

    // Create Google Calendar Event
    const eventId = await this.googleCalendarService.createEvent(professional, {
      summary: `Agendamento: ${service.name} - ${professional.name}`,
      description: `Cliente: ${state.phone}`,
      start: startDateTime,
      end: endDateTime,
    });

    // Save Appointment
    const appointment = this.appointmentRepo.create({
      userId,
      professionalId: professional.id,
      serviceId: service.id,
      startTime: startDateTime,
      endTime: endDateTime,
      status: AppointmentStatus.SCHEDULED,
      googleEventId: eventId,
    });

    await this.appointmentRepo.save(appointment);

    // Clear State
    await this.stateRepo.delete(state.phone);

    // Confirm
    await this.messengerProvider.sendText(
      state.phone,
      `Agendamento confirmado para ${dateStr} às ${time}! Protocolo: ${eventId}`,
    );
  }

  private parseDate(text: string): Date | null {
    const now = new Date();
    const input = text.toLowerCase().trim();

    if (input === 'hoje') return now;
    if (input === 'amanhã' || input === 'amanha') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    // DD/MM or DD/MM/YYYY
    const parts = input.split('/');
    if (parts.length >= 2) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year =
        parts.length === 3 ? parseInt(parts[2], 10) : now.getFullYear();

      const date = new Date(year, month, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        // If no year provided and date is in past, assume next year? Or keep current year (user error if past).
        // Let's assume current year.
        return date;
      }
    }

    return null;
  }

  private generateTimeSlots(
    freeIntervals: any[],
    durationMinutes: number,
  ): string[] {
    const slots: string[] = [];

    for (const interval of freeIntervals) {
      let start = new Date(interval.start);
      const end = new Date(interval.end);

      while (new Date(start.getTime() + durationMinutes * 60000) <= end) {
        const timeString = start.toTimeString().substring(0, 5); // HH:mm
        slots.push(timeString);
        // Increment by duration (or 30 mins, or 1 hour?)
        // Ideally increment by 30 mins or 1 hour to have standardized slots
        start = new Date(start.getTime() + 60 * 60000); // 1 hour steps
      }
    }
    return slots;
  }
}
