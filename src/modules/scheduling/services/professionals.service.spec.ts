import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalsService } from './professionals.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Professional } from '../entities/professional.entity';
import { Appointment } from '../entities/appointment.entity';
import { MESSENGER_PROVIDER } from '../../messenger/messenger.constants';
import { GoogleCalendarService } from './google-calendar.service';
import { AppointmentStatus } from '../enums/appointment-status.enum';

describe('ProfessionalsService', () => {
  let service: ProfessionalsService;

  const mockProfessionalRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockAppointmentRepo = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockMessengerProvider = {
    sendText: jest.fn(),
  };

  const mockGoogleCalendarService = {
    deleteEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalsService,
        {
          provide: getRepositoryToken(Professional),
          useValue: mockProfessionalRepo,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepo,
        },
        {
          provide: MESSENGER_PROVIDER,
          useValue: mockMessengerProvider,
        },
        {
          provide: GoogleCalendarService,
          useValue: mockGoogleCalendarService,
        },
      ],
    }).compile();

    service = module.get<ProfessionalsService>(ProfessionalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a professional', async () => {
      const dto = {
        name: 'Dr. Test',
        specialty: 'Test',
        calendarId: 'primary',
      };
      const entity = { id: '1', ...dto };

      mockProfessionalRepo.create.mockReturnValue(entity);
      mockProfessionalRepo.save.mockResolvedValue(entity);

      const result = await service.create(dto);
      expect(result).toEqual(entity);
      expect(mockProfessionalRepo.create).toHaveBeenCalledWith(dto);
      expect(mockProfessionalRepo.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('remove', () => {
    it('should cancel future appointments, notify users, and soft delete professional', async () => {
      const professionalId = 'prof-1';
      const professional = {
        id: professionalId,
        name: 'Dr. Who',
        calendarId: 'cal-id',
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const appointments = [
        {
          id: 'appt-1',
          professionalId,
          status: AppointmentStatus.SCHEDULED,
          startTime: futureDate,
          user: { id: 'user-1', name: 'User 1', phone: '5511999999999' },
          googleEventId: 'evt-1',
        },
      ];

      mockProfessionalRepo.findOne.mockResolvedValue(professional);
      mockAppointmentRepo.find.mockResolvedValue(appointments);
      mockAppointmentRepo.save.mockResolvedValue({}); // update status
      mockGoogleCalendarService.deleteEvent.mockResolvedValue({});
      mockProfessionalRepo.softDelete.mockResolvedValue({});

      await service.remove(professionalId);

      // Verify appointment status update
      expect(mockAppointmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'appt-1',
          status: AppointmentStatus.CANCELED,
        }),
      );

      // Verify notification
      expect(mockMessengerProvider.sendText).toHaveBeenCalledWith(
        '5511999999999',
        expect.stringContaining('foi cancelado'),
      );

      // Verify Google Calendar deletion
      expect(mockGoogleCalendarService.deleteEvent).toHaveBeenCalledWith(
        professional,
        'evt-1',
      );

      // Verify soft delete
      expect(mockProfessionalRepo.softDelete).toHaveBeenCalledWith(
        professionalId,
      );
    });
  });
});
