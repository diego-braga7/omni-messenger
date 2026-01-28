import { Test, TestingModule } from '@nestjs/testing';
import { GoogleCalendarService } from './google-calendar.service';
import { ConfigService } from '@nestjs/config';

// Mocking googleapis
const mCalendar = {
  freebusy: {
    query: jest.fn(),
  },
  events: {
    insert: jest.fn(),
    delete: jest.fn(),
  },
};

const mOAuth2Client = {
  setCredentials: jest.fn(),
  generateAuthUrl: jest.fn(),
  getToken: jest.fn(),
};

jest.mock('googleapis', () => {
  return {
    google: {
      calendar: jest.fn(() => mCalendar),
      auth: {
        OAuth2: jest.fn(() => mOAuth2Client),
      },
    },
  };
});

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;

  const mockConfigService = {
    get: jest.fn((key) => {
      switch (key) {
        case 'GOOGLE_CLIENT_ID':
          return 'client-id';
        case 'GOOGLE_CLIENT_SECRET':
          return 'client-secret';
        case 'GOOGLE_REDIRECT_URI':
          return 'http://localhost/callback';
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

    // Clear mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAvailability', () => {
    it('should return free slots when busy slots are provided', async () => {
      const professional = {
        calendarId: 'primary',
        googleAccessToken: 'token',
      };
      const start = new Date('2023-10-27T09:00:00Z');
      const end = new Date('2023-10-27T17:00:00Z');

      const busySlots = [
        {
          start: '2023-10-27T10:00:00.000Z',
          end: '2023-10-27T11:00:00.000Z',
        },
        {
          start: '2023-10-27T14:00:00.000Z',
          end: '2023-10-27T15:00:00.000Z',
        },
      ];

      mCalendar.freebusy.query.mockResolvedValue({
        data: {
          calendars: {
            [professional.calendarId]: {
              busy: busySlots,
            },
          },
        },
      });

      const freeSlots = await service.checkAvailability(
        professional,
        start,
        end,
      );

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
      const professional = {
        calendarId: 'primary',
        googleAccessToken: 'token',
      };
      const eventData = {
        summary: 'Test Event',
        start: new Date('2023-10-27T09:00:00Z'),
        end: new Date('2023-10-27T10:00:00Z'),
      };
      const expectedId = 'event123';

      mCalendar.events.insert.mockResolvedValue({
        data: { id: expectedId },
      });

      const eventId = await service.createEvent(professional, eventData);

      expect(eventId).toBe(expectedId);
      expect(mCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: professional.calendarId,
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
      const professional = {
        calendarId: 'primary',
        googleAccessToken: 'token',
      };
      const eventId = 'event123';

      mCalendar.events.delete.mockResolvedValue({});

      await service.deleteEvent(professional, eventId);

      expect(mCalendar.events.delete).toHaveBeenCalledWith({
        calendarId: professional.calendarId,
        eventId,
      });
    });
  });
});
