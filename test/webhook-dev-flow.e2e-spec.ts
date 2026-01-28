import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RabbitmqService } from '../src/modules/rabbitmq/rabbitmq.service';
import { WebhookController } from '../src/modules/messenger/webhook.controller';
import { SchedulingService } from '../src/modules/scheduling/services/scheduling.service';
import { ConversationState } from '../src/modules/scheduling/entities/conversation-state.entity';
import { Service } from '../src/modules/scheduling/entities/service.entity';
import { Professional } from '../src/modules/scheduling/entities/professional.entity';
import { Appointment } from '../src/modules/scheduling/entities/appointment.entity';
import { UsersService } from '../src/modules/users/services/users.service';
import { MESSENGER_PROVIDER } from '../src/modules/messenger/messenger.constants';
import { RABBITMQ_EVENTS } from '../src/common/constants';
import { GoogleCalendarService } from '../src/modules/scheduling/services/google-calendar.service';

describe('Webhook DEV Flow (e2e)', () => {
  let app: INestApplication;
  let schedulingService: SchedulingService;

  const mockRabbitmqService = {
    sendMessage: jest.fn().mockResolvedValue(null),
  };

  const mockStateRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockServiceRepo = {
    find: jest.fn(),
  };

  const mockProfessionalRepo = {
    find: jest.fn(),
  };

  const mockAppointmentRepo = {
    save: jest.fn(),
  };

  const mockUsersService = {
    findOrCreate: jest
      .fn()
      .mockResolvedValue({ id: 'user-1', phone: '5564996064649' }),
  };

  const mockMessengerProvider = {
    sendOptionList: jest.fn(),
    sendButtonList: jest.fn(),
    sendText: jest.fn(),
  };

  const mockGoogleCalendarService = {
    checkAvailability: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'NODE_ENV') return 'DEV';
      return null;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        SchedulingService,
        { provide: RabbitmqService, useValue: mockRabbitmqService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: getRepositoryToken(ConversationState),
          useValue: mockStateRepo,
        },
        { provide: getRepositoryToken(Service), useValue: mockServiceRepo },
        {
          provide: getRepositoryToken(Professional),
          useValue: mockProfessionalRepo,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepo,
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MESSENGER_PROVIDER, useValue: mockMessengerProvider },
        { provide: GoogleCalendarService, useValue: mockGoogleCalendarService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    schedulingService = moduleFixture.get<SchedulingService>(SchedulingService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle DEV webhook simulation and trigger scheduling flow', async () => {
    // 1. Call Webhook with success scenario
    const response = await request(app.getHttpServer())
      .post('/messenger/webhook')
      .send({ scenario: 'success' })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'simulated',
        mode: 'DEV',
        scenario: 'success',
      }),
    );

    // 2. Verify RabbitMQ message
    expect(mockRabbitmqService.sendMessage).toHaveBeenCalledWith(
      RABBITMQ_EVENTS.MESSAGE_RECEIVED,
      expect.objectContaining({
        phone: '5564996064649',
        type: 'button_response',
        text: 'sim',
        contentPayload: expect.objectContaining({
          selectedButtonId: 'sim',
        }),
      }),
    );

    const emittedEvent = mockRabbitmqService.sendMessage.mock.calls[0][1];

    // 3. Setup mocks for SchedulingService
    // Simulate no existing state (new conversation)
    mockStateRepo.findOne.mockResolvedValue(null);
    // Simulate available services
    mockServiceRepo.find.mockResolvedValue([
      { id: 'srv-1', name: 'Test Service', price: 100, durationMinutes: 60 },
    ]);

    // 4. Trigger SchedulingService manually with the event data
    // (Simulating the Consumer)
    await schedulingService.handleMessage(
      emittedEvent.phone,
      emittedEvent.text,
      emittedEvent.type,
      emittedEvent.contentPayload,
    );

    // 5. Verify startScheduling was called (indirectly via side effects)
    // Expect sendOptionList (Service List)
    expect(mockMessengerProvider.sendOptionList).toHaveBeenCalledWith(
      '5564996064649',
      expect.stringContaining('Escolha um serviço'),
      expect.any(Array),
      expect.any(Object),
    );

    // Expect sendButtonList (Test Message in DEV for this number)
    expect(mockMessengerProvider.sendButtonList).toHaveBeenCalledWith(
      '5564996064649',
      expect.stringContaining('Mensagem de teste'),
      expect.arrayContaining([
        expect.objectContaining({ id: 'sim', label: 'Sim' }),
        expect.objectContaining({ id: 'nao', label: 'Não' }),
      ]),
      expect.any(Object),
    );
  }, 30000);
});
