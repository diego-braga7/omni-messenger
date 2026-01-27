
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SchedulingModule } from '../src/modules/scheduling/scheduling.module';
import { SchedulingService } from '../src/modules/scheduling/services/scheduling.service';
import { MESSENGER_PROVIDER } from '../src/modules/messenger/messenger.constants';
import { RabbitmqService } from '../src/modules/rabbitmq/rabbitmq.service';
import { getTypeOrmConfig } from '../src/config/typeorm.config';
import { UsersModule } from '../src/modules/users/users.module';
import { Service } from '../src/modules/scheduling/entities/service.entity';
import { Professional } from '../src/modules/scheduling/entities/professional.entity';
import { ConversationState } from '../src/modules/scheduling/entities/conversation-state.entity';
import { Appointment } from '../src/modules/scheduling/entities/appointment.entity';
import { GoogleCalendarService } from '../src/modules/scheduling/services/google-calendar.service';

// Mock Messenger
const mockMessenger = {
  calls: {
      sendOptionList: [] as any[],
      sendButtonList: [] as any[],
      sendText: [] as any[]
  },
  sendOptionList: async (phone: string, text: string, options: any) => {
    console.log(`[MOCK] sendOptionList to ${phone}: ${text}`);
    console.log(`[MOCK] Options:`, JSON.stringify(options, null, 2));
    mockMessenger.calls.sendOptionList.push({phone, text, options});
    return { messageId: 'mock-id' };
  },
  sendButtonList: async (phone: string, text: string, buttons: any) => {
    console.log(`[MOCK] sendButtonList to ${phone}: ${text}`);
    console.log(`[MOCK] Buttons:`, JSON.stringify(buttons, null, 2));
    mockMessenger.calls.sendButtonList.push({phone, text, buttons});
    return { messageId: 'mock-id' };
  },
  sendText: async (phone: string, text: string) => {
    console.log(`[MOCK] sendText to ${phone}: ${text}`);
    mockMessenger.calls.sendText.push({phone, text});
    return { messageId: 'mock-id' };
  },
};

// Mock RabbitMQ
const mockRabbitmq = {
    connect: async () => {},
    publish: async () => {},
    sendMessage: async () => {},
};

// Mock Google Calendar
const mockGoogleCalendar = {
    checkAvailability: async (professional: any, start: Date, end: Date) => {
        console.log(`[MOCK] checkAvailability for ${professional.name} from ${start} to ${end}`);
        // Return one big free interval for the whole day
        return [{ start: start.toISOString(), end: end.toISOString() }];
    },
    createEvent: async (professional: any, eventData: any) => {
        console.log(`[MOCK] createEvent for ${professional.name}:`, eventData);
        return 'mock-google-event-id';
    },
};

async function run() {
  console.log('Initializing simulation...');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
             const config = getTypeOrmConfig(configService);
             return {
                 ...config,
                 host: 'localhost', // Override for local execution
             };
        },
        inject: [ConfigService],
      }),
      ThrottlerModule.forRoot([{
        ttl: 60000,
        limit: 10,
      }]),
      SchedulingModule,
      UsersModule,
    ],
  })
    .overrideProvider(MESSENGER_PROVIDER)
    .useValue(mockMessenger)
    .overrideProvider(RabbitmqService)
    .useValue(mockRabbitmq)
    .overrideProvider(GoogleCalendarService)
    .useValue(mockGoogleCalendar)
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const schedulingService = moduleFixture.get<SchedulingService>(SchedulingService);
  const serviceRepo = moduleFixture.get(getRepositoryToken(Service));
  const professionalRepo = moduleFixture.get(getRepositoryToken(Professional));
  const stateRepo = moduleFixture.get(getRepositoryToken(ConversationState));
  const appointmentRepo = moduleFixture.get(getRepositoryToken(Appointment));

  const PHONE = '5564996064649';
  const PROFESSIONAL_ID = 'e381836f-715c-4cb4-aee5-76028fd6371b';

  console.log('--- SETUP ---');
  
  // Clear previous state
  await stateRepo.delete({ phone: PHONE });
  console.log('Cleared previous conversation state.');

  // Ensure Services exist
  let services = await serviceRepo.find();
  if (services.length === 0) {
      console.log('Seeding Services...');
      const s1 = serviceRepo.create({ name: 'Corte de Cabelo', durationMinutes: 60, price: 50 });
      const s2 = serviceRepo.create({ name: 'Barba', durationMinutes: 30, price: 30 });
      await serviceRepo.save([s1, s2]);
      services = await serviceRepo.find();
  }
  console.log(`Services available: ${services.length}`);

  // Ensure Professional exists
  let professional = await professionalRepo.findOne({ where: { id: PROFESSIONAL_ID } });
  if (!professional) {
      console.log(`Professional ${PROFESSIONAL_ID} not found. Creating...`);
      professional = professionalRepo.create({
          id: PROFESSIONAL_ID,
          name: 'Diego Professional',
          specialty: 'Barbeiro',
          calendarId: 'primary', 
      });
      await professionalRepo.save(professional);
  } else {
      console.log(`Professional found: ${professional.name}`);
  }

  console.log('--- STARTING FLOW ---');

  try {
      // Step 1: Initial Message
      console.log('\nStep 1: User says "Oi, quero agendar"');
      await schedulingService.handleMessage(PHONE, 'Oi, quero agendar', 'text', null);

      // Inspect Step 1 Response (Service List)
      const lastCall1 = mockMessenger.calls.sendOptionList[mockMessenger.calls.sendOptionList.length - 1];
      if (!lastCall1) {
          console.error('Expected sendOptionList was not called! Maybe there is an active appointment or error.');
          const lastText = mockMessenger.calls.sendText[mockMessenger.calls.sendText.length - 1];
          if (lastText) console.log('Last text:', lastText.text);
          process.exit(1);
      }
      
      const servicesList = lastCall1.options[0].rows; // It's structured as [{title:..., rows: ...}]
      if (!servicesList || servicesList.length === 0) {
           console.error('No services found!');
           process.exit(1);
      }
      const serviceId = servicesList[0].id; // Pick first service
      console.log(`Selected Service ID: ${serviceId} (${servicesList[0].title})`);

      // Step 2: Select Service
      console.log(`\nStep 2: User selects service ${serviceId}`);
      await schedulingService.handleMessage(PHONE, 'Serviço escolhido', 'list_reply', { selectedRowId: serviceId });

      // Inspect Step 2 Response (Professional List)
      const lastCall2 = mockMessenger.calls.sendOptionList[mockMessenger.calls.sendOptionList.length - 1];
      if (!lastCall2) {
          console.error('Expected sendOptionList (Professionals) was not called!');
          process.exit(1);
      }
      
      const professionalsList = lastCall2.options[0].rows;
      console.log('Available Professionals:', professionalsList.map((p: any) => `${p.title} (${p.id})`));
      
      // Verify if the requested professional is in the list
      const targetProf = professionalsList.find((p: any) => p.id === PROFESSIONAL_ID);
      let selectedProfId;
      if (!targetProf) {
          console.warn(`Requested professional ${PROFESSIONAL_ID} not found in list. Using first available.`);
          selectedProfId = professionalsList[0].id;
      } else {
          console.log(`Found requested professional: ${targetProf.title}`);
          selectedProfId = targetProf.id;
      }

      // Step 3: Select Professional
      console.log(`\nStep 3: User selects professional ${selectedProfId}`);
      await schedulingService.handleMessage(PHONE, 'Profissional escolhido', 'list_reply', { selectedRowId: selectedProfId });

      // Expect Date Question
      const lastCall3 = mockMessenger.calls.sendText[mockMessenger.calls.sendText.length - 1];
      console.log(`System says: ${lastCall3 ? lastCall3.text : 'No text response'}`);

      // Step 4: Select Date
      console.log('\nStep 4: User says "amanhã"');
      
      // Capture calls count to detect new calls
      const optionListCountBefore = mockMessenger.calls.sendOptionList.length;
      const buttonListCountBefore = mockMessenger.calls.sendButtonList.length;

      await schedulingService.handleMessage(PHONE, 'amanhã', 'text', null);

      let timeSlotId;
      
      if (mockMessenger.calls.sendOptionList.length > optionListCountBefore) {
           const lastCall = mockMessenger.calls.sendOptionList[mockMessenger.calls.sendOptionList.length - 1];
           console.log('Received time slots via Option List');
           const slots = lastCall.options[0].rows;
           if (slots.length > 0) {
               timeSlotId = slots[0].id;
               console.log(`Selected Time Slot: ${timeSlotId}`);
           } else {
               console.error('No time slots available!');
           }
      } else if (mockMessenger.calls.sendButtonList.length > buttonListCountBefore) {
           const lastCall = mockMessenger.calls.sendButtonList[mockMessenger.calls.sendButtonList.length - 1];
           console.log('Received time slots via Button List');
           const buttons = lastCall.buttons;
           if (buttons.length > 0) {
               timeSlotId = buttons[0].id;
               console.log(`Selected Time Slot: ${timeSlotId}`);
           } else {
               console.error('No time slots available!');
           }
      } else {
          const lastText = mockMessenger.calls.sendText[mockMessenger.calls.sendText.length - 1];
          console.log(`System response: ${lastText ? lastText.text : 'No response'}`);
          if (lastText && lastText.text.toLowerCase().includes('não há horários')) {
              console.error('Flow stopped due to lack of availability.');
          }
      }

      if (timeSlotId) {
          // Step 5: Select Time
          console.log(`\nStep 5: User selects time ${timeSlotId}`);
          await schedulingService.handleMessage(PHONE, 'Horário escolhido', 'list_reply', { selectedRowId: timeSlotId });
          
          // Expect Confirmation
          const lastText = mockMessenger.calls.sendText[mockMessenger.calls.sendText.length - 1];
          console.log(`Final Response: ${lastText ? lastText.text : 'No confirmation received'}`);
      }

  } catch (error) {
      console.error('Error during simulation:', error);
  } finally {
      await app.close();
  }
}

run();
