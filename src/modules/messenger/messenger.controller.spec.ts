import { Test, TestingModule } from '@nestjs/testing';
import { MessengerController } from './messenger.controller';
import { MessengerService } from './services/messenger.service';
import { SendTextDto } from './dto/send-text.dto';
import { SendDocumentDto } from './dto/send-document.dto';

describe('MessengerController', () => {
  let controller: MessengerController;
  let service: MessengerService;

  const mockService = {
    sendText: jest.fn(),
    sendDocument: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessengerController],
      providers: [
        {
          provide: MessengerService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MessengerController>(MessengerController);
    service = module.get<MessengerService>(MessengerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendText', () => {
    it('should call sendText on service', async () => {
      const dto: SendTextDto = { phone: '5511999999999', message: 'Hello' };
      mockService.sendText.mockResolvedValue({ id: '1', ...dto });

      await controller.sendText(dto);

      expect(service.sendText).toHaveBeenCalledWith(dto);
    });
  });

  describe('sendDocument', () => {
    it('should call sendDocument on service', async () => {
      const dto: SendDocumentDto = {
        phone: '5511999999999',
        document: 'http://url.com/doc.pdf',
        fileName: 'doc',
        extension: 'pdf',
      };
      mockService.sendDocument.mockResolvedValue({ id: '1', ...dto });

      await controller.sendDocument(dto);

      expect(service.sendDocument).toHaveBeenCalledWith(dto);
    });
  });

  describe('getHistory', () => {
    it('should return message history', async () => {
      const result = [{ id: '1', content: 'test' }];
      mockService.findAll.mockResolvedValue(result);

      expect(await controller.getHistory()).toBe(result);
    });
  });

  describe('getMessage', () => {
    it('should return a single message', async () => {
      const message = { id: '1', content: 'hello' };
      mockService.findOne.mockResolvedValue(message);
      expect(await controller.getMessage('1')).toEqual(message);
      expect(mockService.findOne).toHaveBeenCalledWith('1');
    });
  });
});
