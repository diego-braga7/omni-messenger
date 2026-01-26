import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Professional } from '../entities/professional.entity';
import { Appointment } from '../entities/appointment.entity';
import { CreateProfessionalDto } from '../dtos/create-professional.dto';
import { UpdateProfessionalDto } from '../dtos/update-professional.dto';
import { MESSENGER_PROVIDER } from '../../messenger/messenger.constants';
import { IMessengerProvider } from '../../messenger/interfaces/messenger.interface';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { GoogleCalendarService } from './google-calendar.service';

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(
    @InjectRepository(Professional)
    private readonly professionalRepo: Repository<Professional>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @Inject(MESSENGER_PROVIDER)
    private readonly messengerProvider: IMessengerProvider,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  async create(createProfessionalDto: CreateProfessionalDto): Promise<Professional> {
    const professional = this.professionalRepo.create(createProfessionalDto);
    return this.professionalRepo.save(professional);
  }

  async findAll(): Promise<Professional[]> {
    return this.professionalRepo.find();
  }

  async findOne(id: string): Promise<Professional> {
    const professional = await this.professionalRepo.findOne({ where: { id } });
    if (!professional) {
      throw new NotFoundException(`Professional with ID ${id} not found`);
    }
    return professional;
  }

  async update(id: string, updateProfessionalDto: UpdateProfessionalDto): Promise<Professional> {
    const professional = await this.findOne(id);
    this.professionalRepo.merge(professional, updateProfessionalDto);
    return this.professionalRepo.save(professional);
  }

  async remove(id: string): Promise<void> {
    const professional = await this.findOne(id);

    // Find future scheduled appointments
    const appointments = await this.appointmentRepo.find({
      where: {
        professionalId: id,
        status: AppointmentStatus.SCHEDULED,
        startTime: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    this.logger.log(`Cancelling ${appointments.length} appointments for professional ${id}`);

    for (const appointment of appointments) {
      // 1. Update status
      appointment.status = AppointmentStatus.CANCELED;
      await this.appointmentRepo.save(appointment);

      // 2. Notify User
      if (appointment.user && appointment.user.phone) {
        const message = `Olá ${appointment.user.name || ''}, seu agendamento com ${professional.name} para ${appointment.startTime.toLocaleString()} foi cancelado pois o profissional não está mais disponível. Entraremos em contato para reagendar.`;
        try {
          await this.messengerProvider.sendText(appointment.user.phone, message);
        } catch (error) {
          this.logger.error(`Failed to notify user ${appointment.user.id}: ${error.message}`);
        }
      }

      // 3. Remove from Google Calendar
      if (appointment.googleEventId) {
        try {
            // Note: deleteEvent requires tokens. If professional is being deleted, we still have the entity loaded with tokens.
            await this.googleCalendarService.deleteEvent(professional, appointment.googleEventId);
        } catch (error) {
            this.logger.warn(`Failed to delete event ${appointment.googleEventId} from Google Calendar: ${error.message}`);
        }
      }
    }

    // Soft delete professional
    await this.professionalRepo.softDelete(id);
  }
}
