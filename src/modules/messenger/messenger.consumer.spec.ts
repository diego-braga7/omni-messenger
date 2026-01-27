import { Test, TestingModule } from '@nestjs/testing';
import { MessengerConsumer } from './messenger.consumer';
import { MessengerService } from './services/messenger.service';
import { RABBITMQ_EVENTS } from '../../common/constants';
import { RmqContext } from '@nestjs/microservices';

describe('MessengerConsumer', () => {
  let consumer: MessengerConsumer;
  let messengerService: MessengerService;

  const mockMessengerService = {
    processMessage: jest.fn(),
  };

  const mockRmqContext = {
    getChannelRef: jest.fn().mockReturnValue({
      ack: jest.fn(),
      nack: jest.fn(),
    }),
    getMessage: jest.fn().mockReturnValue({}),
  } as unknown as RmqContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessengerConsumer],
      providers: [
        {
          provide: MessengerService,
          useValue: mockMessengerService,
        },
      ],
    }).compile();

    consumer = module.get<MessengerConsumer>(MessengerConsumer);
    messengerService = module.get<MessengerService>(MessengerService);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('handleProcessMessage', () => {
    it('should call processMessage and ack the message', async () => {
      const data = { messageId: '123' };
      mockMessengerService.processMessage.mockResolvedValue(undefined);

      await consumer.handleProcessMessage(data, mockRmqContext);

      expect(messengerService.processMessage).toHaveBeenCalledWith('123');
      expect(mockRmqContext.getChannelRef().ack).toHaveBeenCalled();
    });

    it('should ack the message even if processing fails', async () => {
      const data = { messageId: '123' };
      mockMessengerService.processMessage.mockRejectedValue(new Error('Processing failed'));

      await consumer.handleProcessMessage(data, mockRmqContext);

      expect(messengerService.processMessage).toHaveBeenCalledWith('123');
      expect(mockRmqContext.getChannelRef().ack).toHaveBeenCalled();
    });
  });
});
