import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MessengerModule } from './../src/modules/messenger/messenger.module';
import { MessageRepository } from './../src/modules/messenger/repositories/message.repository';
import { MessageTemplateRepository } from './../src/modules/messenger/repositories/message-template.repository';
import { UserRepository } from './../src/modules/messenger/repositories/user.repository';
import { RabbitmqService } from './../src/modules/messenger/../rabbitmq/rabbitmq.service';
import { MESSENGER_PROVIDER } from './../src/modules/messenger/messenger.constants';
import { Message } from './../src/modules/messenger/entities/message.entity';
import { MessageTemplate } from './../src/modules/messenger/entities/message-template.entity';
import { User } from './../src/modules/messenger/entities/user.entity';

describe('MessengerController (e2e)', () => {
  let app: INestApplication;
  let messageRepo: MessageRepository;
  let templateRepo: MessageTemplateRepository;
  let userRepo: UserRepository;

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
    findOrCreate: jest.fn().mockResolvedValue({ id: 'u1', phone: '5511999999999' }),
  };

  const mockRabbitmqService = {
    sendMessage: jest.fn().mockResolvedValue(null),
  };

  const mockMessengerProvider = {
    sendText: jest.fn(),
    sendDocument: jest.fn(),
  };

  beforeAll(async () => {
    process.env.RABBITMQ_URI = 'amqp://user:password@localhost:5672';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: '127.0.0.1',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'omni_messenger',
          entities: [Message, MessageTemplate, User],
          synchronize: true,
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
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/messenger/text (POST)', () => {
    const dto = { phone: '5511999999999', message: 'Hello World' };
    mockMessageRepo.create.mockResolvedValue({ id: '1', ...dto });

    return request(app.getHttpServer())
      .post('/messenger/text')
      .send(dto)
      .expect(202);
  });

  it('/messenger/history (GET)', () => {
    return request(app.getHttpServer())
      .get('/messenger/history')
      .expect(200)
      .expect([]);
  });

  it('/templates (POST)', () => {
    const dto = { name: 'Welcome', content: 'Hi there', type: 'TEXT' };
    mockTemplateRepo.create.mockResolvedValue({ id: '1', ...dto });

    return request(app.getHttpServer())
      .post('/templates')
      .send(dto)
      .expect(201);
  });
});
