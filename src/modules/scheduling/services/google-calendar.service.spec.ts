import { Test, TestingModule } from '@nestjs/testing';
import { GoogleCalendarService } from './google-calendar.service';
import { ConfigService } from '@nestjs/config';

// Mocking googleapis
jest.mock('googleapis', () => {
  const mCalendar = {
    freebusy: {
      query: jest.fn(),
    },
    events: {
      insert: jest.fn(),
      delete: jest.fn(),
    },
  };
  const mAuth = {
    JWT: jest.fn().mockImplementation(() => ({})),
  };
  return {
    google: {
      calendar: jest.fn(() => mCalendar),
      auth: mAuth,
    },
  };
});

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key) => {
      switch (key) {
        case 'GOOGLE_CLIENT_EMAIL':
          return 'test@example.com';
        case 'GOOGLE_PRIVATE_KEY':
          return '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDZ\n-----END PRIVATE KEY-----';
        case 'GOOGLE_PROJECT_ID':
          return 'test-project';
        default:
          return null;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GoogleCalendarService>(GoogleCalendarService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAvailability', () => {
    it('should return free slots when busy slots are provided', async () => {
      const calendarId = 'primary';
      const start = new Date('2023-10-27T09:00:00Z');
      const end = new Date('2023-10-27T17:00:00Z');

      const busySlots = [
        {
          start: '2023-10-27T10:00:00Z',
          end: '2023-10-27T11:00:00Z',
        },
        {
          start: '2023-10-27T14:00:00Z',
          end: '2023-10-27T15:00:00Z',
        },
      ];

      // Access the private calendar mock
      const calendarMock = (service as any).calendar;
      calendarMock.freebusy.query.mockResolvedValue({
        data: {
          calendars: {
            [calendarId]: {
              busy: busySlots,
            },
          },
        },
      });

      const freeSlots = await service.checkAvailability(calendarId, start, end);

      // Expected free slots:
      // 09:00 - 10:00
      // 11:00 - 14:00
      // 15:00 - 17:00
      expect(freeSlots).toHaveLength(3);
      expect(freeSlots[0].start).toBe(start.toISOString());
      expect(freeSlots[0].end).toBe(busySlots[0].start);
      expect(freeSlots[1].start).toBe(busySlots[0].end);
      expect(freeSlots[1].end).toBe(busySlots[1].start);
      expect(freeSlots[2].start).toBe(busySlots[1].end);
      expect(freeSlots[2].end).toBe(end.toISOString());
    });
  });

  describe('createEvent', () => {
    it('should create an event and return ID', async () => {
      const calendarId = 'primary';
      const eventData = {
        summary: 'Test Event',
        start: new Date('2023-10-27T09:00:00Z'),
        end: new Date('2023-10-27T10:00:00Z'),
      };
      const expectedId = 'event123';

      const calendarMock = (service as any).calendar;
      calendarMock.events.insert.mockResolvedValue({
        data: { id: expectedId },
      });

      const eventId = await service.createEvent(calendarId, eventData);

      expect(eventId).toBe(expectedId);
      expect(calendarMock.events.insert).toHaveBeenCalledWith({
        calendarId,
        requestBody: expect.objectContaining({
          summary: eventData.summary,
          start: { dateTime: eventData.start.toISOString() },
          end: { dateTime: eventData.end.toISOString() },
        }),
      });
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const calendarId = 'primary';
      const eventId = 'event123';

      const calendarMock = (service as any).calendar;
      calendarMock.events.delete.mockResolvedValue({});

      await service.deleteEvent(calendarId, eventId);

      expect(calendarMock.events.delete).toHaveBeenCalledWith({
        calendarId,
        eventId,
      });
    });
  });
});
