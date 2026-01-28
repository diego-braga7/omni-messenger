import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calendar_v3, google } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private readonly configService: ConfigService) {}

  generateAuthUrl(state: string) {
    const oAuth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );

    return oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: state,
      prompt: 'consent',
    });
  }

  async getTokens(code: string) {
    const oAuth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );

    const { tokens } = await oAuth2Client.getToken(code);
    return tokens;
  }

  private getOAuthClient(
    accessToken?: string | null,
    refreshToken?: string | null,
  ) {
    if (!accessToken && !refreshToken) {
      throw new Error('No authentication credentials provided');
    }

    const oAuth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );

    oAuth2Client.setCredentials({
      access_token: accessToken || undefined,
      refresh_token: refreshToken || undefined,
    });

    return oAuth2Client;
  }

  async checkAvailability(
    professional: {
      calendarId: string;
      googleAccessToken?: string | null;
      googleRefreshToken?: string | null;
    },
    start: Date,
    end: Date,
  ): Promise<calendar_v3.Schema$TimePeriod[]> {
    const auth = this.getOAuthClient(
      professional.googleAccessToken,
      professional.googleRefreshToken,
    );
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          items: [{ id: professional.calendarId }],
        },
      });

      const busyIntervals =
        response.data.calendars?.[professional.calendarId]?.busy || [];

      return this.calculateFreeSlots(start, end, busyIntervals);
    } catch (error) {
      this.logger.error(
        `Error checking availability for ${professional.calendarId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private calculateFreeSlots(
    start: Date,
    end: Date,
    busy: calendar_v3.Schema$TimePeriod[],
  ): calendar_v3.Schema$TimePeriod[] {
    const freeSlots: calendar_v3.Schema$TimePeriod[] = [];
    let lastEnd = start;

    // Sort busy slots just in case
    const validBusy = [...busy].filter((slot) => slot.start && slot.end);
    const sortedBusy = validBusy.sort((a, b) => {
      const startA = a.start ? new Date(a.start).getTime() : 0;
      const startB = b.start ? new Date(b.start).getTime() : 0;
      return startA - startB;
    });

    for (const slot of sortedBusy) {
      // TS check redundant due to filter but safe
      if (!slot.start || !slot.end) continue;

      const busyStart = new Date(slot.start);
      const busyEnd = new Date(slot.end);

      if (busyStart > lastEnd) {
        freeSlots.push({
          start: lastEnd.toISOString(),
          end: busyStart.toISOString(),
        });
      }

      if (busyEnd > lastEnd) {
        lastEnd = busyEnd;
      }
    }

    if (lastEnd < end) {
      freeSlots.push({
        start: lastEnd.toISOString(),
        end: end.toISOString(),
      });
    }

    return freeSlots;
  }

  async createEvent(
    professional: {
      calendarId: string;
      googleAccessToken?: string | null;
      googleRefreshToken?: string | null;
    },
    eventData: {
      summary: string;
      description?: string;
      start: Date;
      end: Date;
      attendees?: string[];
    },
  ): Promise<string> {
    const auth = this.getOAuthClient(
      professional.googleAccessToken,
      professional.googleRefreshToken,
    );
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.events.insert({
        calendarId: professional.calendarId,
        requestBody: {
          summary: eventData.summary,
          description: eventData.description,
          start: {
            dateTime: eventData.start.toISOString(),
          },
          end: {
            dateTime: eventData.end.toISOString(),
          },
          attendees: eventData.attendees?.map((email) => ({ email })),
        },
      });

      this.logger.log(`Event created: ${response.data.id}`);

      if (!response.data.id) {
        throw new Error('Event created but no ID returned');
      }

      return response.data.id;
    } catch (error) {
      this.logger.error(
        `Error creating event in ${professional.calendarId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteEvent(
    professional: {
      calendarId: string;
      googleAccessToken?: string | null;
      googleRefreshToken?: string | null;
    },
    eventId: string,
  ): Promise<void> {
    const auth = this.getOAuthClient(
      professional.googleAccessToken,
      professional.googleRefreshToken,
    );
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      await calendar.events.delete({
        calendarId: professional.calendarId,
        eventId,
      });
      this.logger.log(`Event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error(
        `Error deleting event ${eventId} from ${professional.calendarId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
