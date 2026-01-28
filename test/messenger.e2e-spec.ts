import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';

// Mock TypeORM to handle sqlite enum incompatibility
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    Column: (typeOrOptions: any, options: any) => {
      let finalTypeOrOptions = typeOrOptions;
      if (
        typeof typeOrOptions === 'object' &&
        typeOrOptions !== null
      ) {
        if (typeOrOptions.type === 'enum') {
          finalTypeOrOptions = { ...typeOrOptions, type: 'simple-enum' };
        } else if (typeOrOptions.type === 'jsonb') {
          finalTypeOrOptions = { ...typeOrOptions, type: 'simple-json' };
        }
      }
      return actual.Column(finalTypeOrOptions, options);
    },
  };
});

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MessengerModule } from './../src/modules/messenger/messenger.module';
import { MessageRepository } from './../src/modules/messenger/repositories/message.repository';
import { MessageTemplateRepository } from './../src/modules/messenger/repositories/message-template.repository';
import { UserRepository } from './../src/modules/users/repositories/user.repository';
import { RabbitmqService } from './../src/modules/messenger/../rabbitmq/rabbitmq.service';
import { MESSENGER_PROVIDER } from './../src/modules/messenger/messenger.constants';
import { User } from './../src/modules/users/entities/user.entity';
import { Appointment } from './../src/modules/scheduling/entities/appointment.entity';
import { Professional } from './../src/modules/scheduling/entities/professional.entity';
import { Service } from './../src/modules/scheduling/entities/service.entity';
import { ConversationState } from './../src/modules/scheduling/entities/conversation-state.entity';
import { Message } from './../src/modules/messenger/entities/message.entity';
import { MessageTemplate } from './../src/modules/messenger/entities/message-template.entity';
import { ZApiReturn } from './../src/modules/messenger/entities/z-api-return.entity';

describe('MessengerController (e2e)', () => {
  let app: INestApplication;

  const mockMessageRepo = {
    create: jest.fn(),
    updateStatus: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
  };

  const mockTemplateRepo = {
    create: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepo = {
    findOrCreate: jest
      .fn()
      .mockResolvedValue({ id: 'u1', phone: '5511999999999' }),
    findByIds: jest.fn().mockResolvedValue([]),
  };

  const mockRabbitmqService = {
    sendMessage: jest.fn().mockResolvedValue(null),
  };

  const mockMessengerProvider = {
    sendText: jest.fn(),
    sendDocument: jest.fn(),
  };

  beforeAll(async () => {
    process.env.RABBITMQ_URI = 'amqp://guest:guest@localhost:5672';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          synchronize: true,
          dropSchema: true,
          entities: [
            User,
            Appointment,
            Professional,
            Service,
            ConversationState,
            Message,
            MessageTemplate,
            ZApiReturn,
          ],
        }),
        MessengerModule,
      ],
    })
      .overrideProvider(MessageRepository)
      .useValue(mockMessageRepo)
      .overrideProvider(MessageTemplateRepository)
      .useValue(mockTemplateRepo)
      .overrideProvider(UserRepository)
      .useValue(mockUserRepo)
      .overrideProvider(RabbitmqService)
      .useValue(mockRabbitmqService)
      .overrideProvider(MESSENGER_PROVIDER)
      .useValue(mockMessengerProvider)
      .overrideProvider('RABBITMQ_SERVICE')
      .useValue({
        emit: jest.fn(),
        send: jest.fn(),
        connect: jest.fn(),
        close: jest.fn(),
      })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/messenger/bulk-send (POST)', () => {
    const dto = { phones: ['1', '2'], message: 'bulk' };
    mockMessageRepo.create.mockResolvedValue({ id: '1' }); // for internal calls

    return request(app.getHttpServer())
      .post('/messenger/bulk-send')
      .send(dto)
      .expect(202);
  });

  it('/messenger/text (POST)', () => {
    const dto = { phone: '5511999999999', message: 'Hello World' };
    mockMessageRepo.create.mockResolvedValue({ id: '1', ...dto });

    return request(app.getHttpServer())
      .post('/messenger/text')
      .send(dto)
      .expect(202);
  });
});
