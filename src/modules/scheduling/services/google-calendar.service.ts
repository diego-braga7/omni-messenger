import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calendar_v3, google } from 'googleapis';
import { JWT } from 'google-auth-library';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private calendar: calendar_v3.Calendar;
  private auth: JWT;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient() {
    const clientEmail = this.configService.get<string>('GOOGLE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('GOOGLE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');
    const projectId = this.configService.get<string>('GOOGLE_PROJECT_ID');

    if (!clientEmail || !privateKey || !projectId) {
      this.logger.warn('Google Calendar credentials not fully configured');
      return;
    }

    this.auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async checkAvailability(
    calendarId: string,
    start: Date,
    end: Date,
  ): Promise<calendar_v3.Schema$TimePeriod[]> {
    if (!this.calendar) {
      this.logger.error('Google Calendar client not initialized');
      throw new Error('Google Calendar client not initialized');
    }

    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          items: [{ id: calendarId }],
        },
      });

      const busyIntervals =
        response.data.calendars?.[calendarId]?.busy || [];
      
      // We are returning busy intervals here as per API, but the prompt asked for "available intervals".
      // However, usually we return busy times so the logic can find gaps. 
      // Re-reading prompt: "Retornar intervalos livres" (Return free intervals).
      // To return free intervals, I need to inverse the busy intervals within start-end.
      
      return this.calculateFreeSlots(start, end, busyIntervals);
    } catch (error) {
      this.logger.error(
        `Error checking availability for ${calendarId}: ${error.message}`,
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
    calendarId: string,
    eventData: {
      summary: string;
      description?: string;
      start: Date;
      end: Date;
      attendees?: string[];
    },
  ): Promise<string> {
    if (!this.calendar) {
      throw new Error('Google Calendar client not initialized');
    }

    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: {
          summary: eventData.summary,
          description: eventData.description,
          start: {
            dateTime: eventData.start.toISOString(),
            // Ensure we let Google handle timezone or send it explicitly if needed.
            // Using ISO string implies UTC or offset included.
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
        `Error creating event in ${calendarId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    if (!this.calendar) {
      throw new Error('Google Calendar client not initialized');
    }

    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
      this.logger.log(`Event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error(
        `Error deleting event ${eventId} from ${calendarId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
