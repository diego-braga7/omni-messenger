import { Test, TestingModule } from '@nestjs/testing';
import { MessengerService } from './messenger.service';
import { MessageRepository } from '../repositories/message.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { MessageTemplateRepository } from '../repositories/message-template.repository';
import { ZApiReturnRepository } from '../repositories/z-api-return.repository';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';
import { MESSENGER_PROVIDER } from '../messenger.constants';
import { MessageStatus } from '../enums/message-status.enum';
import { MessageType } from '../enums/message-type.enum';
import { BadRequestException } from '@nestjs/common';

describe('MessengerService', () => {
  let service: MessengerService;

  const mockMessageRepo = {
    create: jest.fn(),
    updateStatus: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  const mockUserRepo = {
    findOrCreate: jest.fn(),
    findByIds: jest.fn(),
  };

  const mockTemplateRepo = {
    findById: jest.fn(),
  };

  const mockZApiReturnRepo = {
    saveReturn: jest.fn(),
  };

  const mockRabbitmqService = {
    sendMessage: jest.fn(),
  };

  const mockProvider = {
    sendText: jest.fn(),
    sendDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessengerService,
        { provide: MessageRepository, useValue: mockMessageRepo },
        { provide: UserRepository, useValue: mockUserRepo },
        { provide: MessageTemplateRepository, useValue: mockTemplateRepo },
        { provide: ZApiReturnRepository, useValue: mockZApiReturnRepo },
        { provide: RabbitmqService, useValue: mockRabbitmqService },
        { provide: MESSENGER_PROVIDER, useValue: mockProvider },
      ],
    }).compile();

    service = module.get<MessengerService>(MessengerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendText', () => {
    it('should create message, queue it, and update status', async () => {
      const dto = { phone: '123', message: 'test' };
      const user = { id: 'u1', phone: '123' };
      const message = {
        id: '1',
        ...dto,
        status: MessageStatus.PENDING,
        userId: user.id,
      };

      mockUserRepo.findOrCreate.mockResolvedValue(user);
      mockMessageRepo.create.mockResolvedValue(message);

      await service.sendText(dto);

      expect(mockUserRepo.findOrCreate).toHaveBeenCalledWith(dto.phone);
      expect(mockMessageRepo.create).toHaveBeenCalledWith({
        to: dto.phone,
        content: dto.message,
        type: MessageType.TEXT,
        status: MessageStatus.PENDING,
        userId: user.id,
        templateId: undefined,
      });
      expect(mockRabbitmqService.sendMessage).toHaveBeenCalledWith(
        'process_message',
        { messageId: '1' },
      );
      expect(mockMessageRepo.updateStatus).toHaveBeenCalledWith(
        '1',
        MessageStatus.QUEUED,
      );
    });

    it('should validate template type TEXT', async () => {
      const dto = { phone: '123', message: 'test', modelId: 't1' };
      const user = { id: 'u1', phone: '123' };
      mockUserRepo.findOrCreate.mockResolvedValue(user);
      mockTemplateRepo.findById.mockResolvedValue({
        id: 't1',
        type: MessageType.DOCUMENT,
      }); // Wrong type

      await expect(service.sendText(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendDocument', () => {
    it('should create document message, queue it, and update status', async () => {
      const dto = {
        phone: '123',
        document: 'http://doc.com',
        fileName: 'doc',
        extension: 'pdf',
      };
      const user = { id: 'u1', phone: '123' };
      const message = {
        id: '1',
        ...dto,
        type: MessageType.DOCUMENT,
        status: MessageStatus.PENDING,
        userId: user.id,
      };

      mockUserRepo.findOrCreate.mockResolvedValue(user);
      mockMessageRepo.create.mockResolvedValue(message);

      await service.sendDocument(dto);

      expect(mockUserRepo.findOrCreate).toHaveBeenCalledWith(dto.phone);
      expect(mockMessageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: dto.phone,
          content: dto.document,
          type: MessageType.DOCUMENT,
          userId: user.id,
        }),
      );
      expect(mockRabbitmqService.sendMessage).toHaveBeenCalledWith(
        'process_message',
        { messageId: '1' },
      );
      expect(mockMessageRepo.updateStatus).toHaveBeenCalledWith(
        '1',
        MessageStatus.QUEUED,
      );
    });

    it('should use extension from template if not provided in DTO', async () => {
      const dto = {
        phone: '123',
        modelId: 'tpl-1',
        fileName: 'doc',
      };
      const user = { id: 'u1', phone: '123' };
      const template = {
        id: 'tpl-1',
        type: MessageType.DOCUMENT,
        content: 'http://doc.com',
        extension: 'pdf',
      };
      const message = {
        id: '1',
        to: dto.phone,
        content: template.content,
        type: MessageType.DOCUMENT,
        fileName: dto.fileName,
        extension: template.extension,
        status: MessageStatus.PENDING,
        userId: user.id,
        templateId: template.id,
      };

      mockUserRepo.findOrCreate.mockResolvedValue(user);
      mockTemplateRepo.findById.mockResolvedValue(template);
      mockMessageRepo.create.mockResolvedValue(message);

      await service.sendDocument(dto);

      expect(mockTemplateRepo.findById).toHaveBeenCalledWith(dto.modelId);
      expect(mockMessageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: template.content,
          extension: template.extension,
        }),
      );
    });
  });

  describe('processMessage', () => {
    it('should do nothing if message not found', async () => {
      mockMessageRepo.findById.mockResolvedValue(null);
      await service.processMessage('999');
      expect(mockProvider.sendText).not.toHaveBeenCalled();
      expect(mockProvider.sendDocument).not.toHaveBeenCalled();
    });

    it('should do nothing if message already sent', async () => {
      mockMessageRepo.findById.mockResolvedValue({
        id: '1',
        status: MessageStatus.SENT,
      });
      await service.processMessage('1');
      expect(mockProvider.sendText).not.toHaveBeenCalled();
    });

    it('should send document message via provider', async () => {
      const message = {
        id: '1',
        to: '123',
        content: 'url',
        type: MessageType.DOCUMENT,
        status: MessageStatus.QUEUED,
        fileName: 'file',
        extension: 'pdf',
        caption: 'cap',
      };
      mockMessageRepo.findById.mockResolvedValue(message);
      mockProvider.sendDocument.mockResolvedValue({
        messageId: 'ext-2',
        zaapId: 'z2',
        id: 'id2',
      });

      await service.processMessage('1');

      expect(mockProvider.sendDocument).toHaveBeenCalledWith(
        '123',
        'url',
        'file',
        'pdf',
        { caption: 'cap' },
      );
      expect(mockMessageRepo.updateStatus).toHaveBeenCalledWith(
        '1',
        MessageStatus.SENT,
        'ext-2',
      );
      expect(mockZApiReturnRepo.saveReturn).toHaveBeenCalledWith(
        '1',
        'z2',
        'id2',
      );
    });

    it('should send text message via provider and update status to SENT', async () => {
      const message = {
        id: '1',
        to: '123',
        content: 'hello',
        type: MessageType.TEXT,
        status: MessageStatus.QUEUED,
      };
      mockMessageRepo.findById.mockResolvedValue(message);
      mockProvider.sendText.mockResolvedValue({
        messageId: 'ext-1',
        zaapId: 'z1',
        id: 'id1',
      });

      await service.processMessage('1');

      expect(mockProvider.sendText).toHaveBeenCalledWith('123', 'hello');
      expect(mockMessageRepo.updateStatus).toHaveBeenCalledWith(
        '1',
        MessageStatus.SENT,
        'ext-1',
      );
      expect(mockZApiReturnRepo.saveReturn).toHaveBeenCalledWith(
        '1',
        'z1',
        'id1',
      );
    });

    it('should log warning if Z-API response is missing IDs', async () => {
      const message = {
        id: '1',
        to: '123',
        content: 'hello',
        type: MessageType.TEXT,
        status: MessageStatus.QUEUED,
      };
      mockMessageRepo.findById.mockResolvedValue(message);
      mockProvider.sendText.mockResolvedValue({ messageId: 'ext-1' }); // missing zaapId/id

      await service.processMessage('1');

      expect(mockProvider.sendText).toHaveBeenCalledWith('123', 'hello');
      expect(mockMessageRepo.updateStatus).toHaveBeenCalledWith(
        '1',
        MessageStatus.SENT,
        'ext-1',
      );
      expect(mockZApiReturnRepo.saveReturn).not.toHaveBeenCalled();
    });

    it('should fail and update status to FAILED', async () => {
      const message = {
        id: '1',
        to: '123',
        content: 'hello',
        type: MessageType.TEXT,
        status: MessageStatus.QUEUED,
      };
      mockMessageRepo.findById.mockResolvedValue(message);
      mockProvider.sendText.mockRejectedValue(new Error('fail'));

      await service.processMessage('1');

      expect(mockMessageRepo.updateStatus).toHaveBeenCalledWith(
        '1',
        MessageStatus.FAILED,
      );
    });
  });

  describe('sendBulk', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process bulk send in batches', async () => {
      const dto = {
        phones: ['1', '2', '3', '4'],
        message: 'hello',
        userIds: [],
      };
      // We will mock sendText to avoid internal calls logic complexity here,
      // or we can just mock findOrCreate and messageRepo.create if we want to test integration within service.
      // To keep unit test isolated, let's spyOn sendText.
      const sendTextSpy = jest
        .spyOn(service, 'sendText')
        .mockResolvedValue({} as any);

      // The loop runs async forEach inside chunks.forEach (sync)
      // but setTimeout makes it async.
      // Wait multiple ticks.
      await service.sendBulk(dto);
      jest.runAllTimers();

      // Wait enough ticks for the async for-of loop inside setTimeout callback to finish
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(sendTextSpy).toHaveBeenCalledTimes(4);
      expect(sendTextSpy).toHaveBeenCalledWith({
        phone: '1',
        message: 'hello',
        modelId: undefined,
      });
      expect(sendTextSpy).toHaveBeenCalledWith({
        phone: '4',
        message: 'hello',
        modelId: undefined,
      });
    });

    it('should fetch phones from users and merge with phones list', async () => {
      const dto = {
        phones: ['1'],
        message: 'hello',
        userIds: ['u1', 'u2'],
      };

      mockUserRepo.findByIds.mockResolvedValue([
        { id: 'u1', phone: '2' },
        { id: 'u2', phone: '3' },
      ]);

      const sendTextSpy = jest
        .spyOn(service, 'sendText')
        .mockResolvedValue({} as any);

      await service.sendBulk(dto);
      jest.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Phones should be 1, 2, 3
      expect(sendTextSpy).toHaveBeenCalledTimes(3);
    });
  });
});
