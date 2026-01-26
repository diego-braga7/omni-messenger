import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingService } from './scheduling.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationState } from '../entities/conversation-state.entity';
import { Service } from '../entities/service.entity';
import { Professional } from '../entities/professional.entity';
import { Appointment } from '../entities/appointment.entity';
import { GoogleCalendarService } from './google-calendar.service';
import { MESSENGER_PROVIDER } from '../../messenger/messenger.constants';
import { UsersService } from '../../users/services/users.service';
import { ConversationStep } from '../enums/conversation-step.enum';

describe('SchedulingService', () => {
  let service: SchedulingService;

  const mockStateRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const mockServiceRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const mockProfessionalRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };
  const mockAppointmentRepo = {
    save: jest.fn(),
  };
  const mockGoogleCalendarService = {
    checkAvailability: jest.fn(),
    createEvent: jest.fn(),
  };
  const mockMessengerProvider = {
    sendText: jest.fn(),
    sendOptionList: jest.fn(),
    sendButtonList: jest.fn(),
  };
  const mockUsersService = {
    findOrCreate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        { provide: getRepositoryToken(ConversationState), useValue: mockStateRepo },
        { provide: getRepositoryToken(Service), useValue: mockServiceRepo },
        { provide: getRepositoryToken(Professional), useValue: mockProfessionalRepo },
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepo },
        { provide: GoogleCalendarService, useValue: mockGoogleCalendarService },
        { provide: MESSENGER_PROVIDER, useValue: mockMessengerProvider },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleMessage', () => {
    it('should start scheduling when receiving "agendar" without state', async () => {
      const phone = '5511999999999';
      mockStateRepo.findOne.mockResolvedValue(null);
      mockServiceRepo.find.mockResolvedValue([
        { id: 's1', name: 'Corte', description: 'Corte de cabelo', duration: 30, price: 50 },
      ]);
      mockUsersService.findOrCreate.mockResolvedValue({ id: 'u1', phone });

      await service.handleMessage(phone, 'agendar', 'text');

      expect(mockStateRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          phone,
          step: ConversationStep.SELECT_SERVICE,
        }),
      );
      expect(mockMessengerProvider.sendOptionList).toHaveBeenCalled();
    });

    it('should handle cancellation', async () => {
      const phone = '5511999999999';
      mockStateRepo.findOne.mockResolvedValue({ phone, step: ConversationStep.SELECT_SERVICE });
      mockUsersService.findOrCreate.mockResolvedValue({ id: 'u1', phone });

      await service.handleMessage(phone, 'cancelar', 'text');

      expect(mockStateRepo.delete).toHaveBeenCalledWith(phone);
      expect(mockMessengerProvider.sendText).toHaveBeenCalledWith(
        phone,
        expect.stringContaining('cancelado'),
      );
    });
  });
});
