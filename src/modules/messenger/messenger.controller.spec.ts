import { Test, TestingModule } from '@nestjs/testing';
import { MessengerController } from './messenger.controller';
import { MESSENGER_PROVIDER } from './messenger.module';
import { IMessengerProvider } from './interfaces/messenger.interface';

const mockMessengerProvider: IMessengerProvider = {
  sendText: jest.fn(),
  sendDocument: jest.fn(),
};

describe('MessengerController', () => {
  let controller: MessengerController;
  let provider: IMessengerProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessengerController],
      providers: [
        {
          provide: MESSENGER_PROVIDER,
          useValue: mockMessengerProvider,
        },
      ],
    }).compile();

    controller = module.get<MessengerController>(MessengerController);
    provider = module.get<IMessengerProvider>(MESSENGER_PROVIDER);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendText', () => {
    it('should call sendText on provider', async () => {
      const dto = { phone: '5511999999999', message: 'Hello' };
      const options = { delayMessage: undefined, delayTyping: undefined };
      (provider.sendText as jest.Mock).mockResolvedValue('success');

      await controller.sendText(dto);

      expect(provider.sendText).toHaveBeenCalledWith(dto.phone, dto.message, options);
    });
  });

  describe('sendDocument', () => {
    it('should call sendDocument on provider', async () => {
      const dto = {
        phone: '5511999999999',
        document: 'http://url.com/doc.pdf',
        fileName: 'doc',
        extension: 'pdf',
      };
      const options = { caption: undefined, delayMessage: undefined };
      (provider.sendDocument as jest.Mock).mockResolvedValue('success');

      await controller.sendDocument(dto);

      expect(provider.sendDocument).toHaveBeenCalledWith(
        dto.phone,
        dto.document,
        dto.fileName,
        dto.extension,
        options,
      );
    });
  });
});
