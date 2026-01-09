import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UsersModule } from './../src/modules/users/users.module';
import { UserRepository } from './../src/modules/users/repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './../src/modules/users/entities/user.entity';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  const mockUserRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
          dropSchema: true,
        }),
        UsersModule,
      ],
    })
      .overrideProvider(UserRepository)
      .useValue(mockUserRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST)', () => {
    const dto = { phone: '5511999999999', name: 'Test User' };
    mockUserRepo.create.mockResolvedValue({ id: '1', ...dto });

    return request(app.getHttpServer())
      .post('/users')
      .send(dto)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toEqual('1');
        expect(res.body.phone).toEqual(dto.phone);
      });
  });

  it('/users (GET)', () => {
    mockUserRepo.findAll.mockResolvedValue([{ id: '1', phone: '123' }]);
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].id).toEqual('1');
      });
  });

  it('/users/:id (GET)', () => {
    mockUserRepo.findById.mockResolvedValue({ id: '1', phone: '123' });
    return request(app.getHttpServer())
      .get('/users/1')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toEqual('1');
      });
  });

  it('/users/:id (PUT)', () => {
    const dto = { name: 'Updated' };
    mockUserRepo.update.mockResolvedValue({
      id: '1',
      name: 'Updated',
      phone: '123',
    });
    return request(app.getHttpServer())
      .put('/users/1')
      .send(dto)
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toEqual('Updated');
      });
  });

  it('/users/:id (DELETE)', () => {
    mockUserRepo.softDelete.mockResolvedValue(undefined);
    return request(app.getHttpServer()).delete('/users/1').expect(204);
  });
});
