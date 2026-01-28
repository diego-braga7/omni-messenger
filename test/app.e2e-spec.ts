import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

import { AppModule } from './../src/app.module';
import { User } from '../src/modules/users/entities/user.entity';
import { Appointment } from '../src/modules/scheduling/entities/appointment.entity';
import { Professional } from '../src/modules/scheduling/entities/professional.entity';
import { Service } from '../src/modules/scheduling/entities/service.entity';
import { ConversationState } from '../src/modules/scheduling/entities/conversation-state.entity';
import { Message } from '../src/modules/messenger/entities/message.entity';
import { MessageTemplate } from '../src/modules/messenger/entities/message-template.entity';
import { ZApiReturn } from '../src/modules/messenger/entities/z-api-return.entity';

// Mock the TypeOrm configuration
jest.mock('./../src/config/typeorm.config', () => {
  return {
    getTypeOrmConfig: () => ({
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
      autoLoadEntities: true,
    }),
  };
});

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    process.env.RABBITMQ_URI = 'amqp://guest:guest@localhost:5672';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('RABBITMQ_SERVICE')
      .useValue({
        emit: jest.fn(),
        send: jest.fn(),
        connect: jest.fn(),
        close: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 60000);

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
