import { Test, TestingModule } from '@nestjs/testing';
import { ZApiProvider } from './z-api.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

describe('ZApiProvider', () => {
  let service: ZApiProvider;
  let httpService: HttpService;

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      switch (key) {
        case 'ZAPI_INSTANCE_ID':
          return 'instance-123';
        case 'ZAPI_TOKEN':
          return 'token-123';
        case 'ZAPI_CLIENT_TOKEN':
          return 'client-token-123';
        default:
          return null;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZApiProvider,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ZApiProvider>(ZApiProvider);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendText', () => {
    it('should call httpService.post with correct params', async () => {
      const phone = '5511999999999';
      const message = 'Hello World';
      const response = { data: { messageId: '123' } };

      mockHttpService.post.mockReturnValue(of(response));

      const result = await service.sendText(phone, message);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.z-api.io/instances/instance-123/token/token-123/send-text',
        { phone, message, delayMessage: undefined, delayTyping: undefined },
        {
          headers: {
            'Client-Token': 'client-token-123',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(response.data);
    });
  });

  describe('sendDocument', () => {
    it('should call httpService.post with correct params', async () => {
      const phone = '5511999999999';
      const document = 'http://example.com/doc.pdf';
      const fileName = 'doc';
      const extension = 'pdf';
      const response = { data: { messageId: '456' } };

      mockHttpService.post.mockReturnValue(of(response));

      const result = await service.sendDocument(
        phone,
        document,
        fileName,
        extension,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.z-api.io/instances/instance-123/token/token-123/send-document/pdf',
        {
          phone,
          document,
          fileName,
          caption: undefined,
          delayMessage: undefined,
        },
        {
          headers: {
            'Client-Token': 'client-token-123',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(response.data);
    });
  });

  describe('sendOptionList', () => {
    it('should call httpService.post with correct params for single section', async () => {
      const phone = '5511999999999';
      const message = 'Select an option';
      const sections = [
        {
          title: 'Section 1',
          rows: [{ id: '1', title: 'Option 1' }],
        },
      ];
      const response = { data: { messageId: '789' } };

      mockHttpService.post.mockReturnValue(of(response));

      const result = await service.sendOptionList(phone, message, sections);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.z-api.io/instances/instance-123/token/token-123/send-option-list',
        {
          phone,
          message,
          title: undefined,
          footer: undefined,
          buttonLabel: 'Opções',
          optionList: {
            title: 'Section 1',
            rows: [{ id: '1', title: 'Option 1', description: undefined }],
          },
        },
        {
          headers: {
            'Client-Token': 'client-token-123',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(response.data);
    });

    it('should handle multiple sections by mapping to Z-API structure', async () => {
      const phone = '5511999999999';
      const message = 'Select an option';
      const sections = [
        { title: 'S1', rows: [{ id: '1', title: 'O1' }] },
        { title: 'S2', rows: [{ id: '2', title: 'O2' }] },
      ];
      const response = { data: { messageId: '789' } };

      mockHttpService.post.mockReturnValue(of(response));

      const result = await service.sendOptionList(phone, message, sections, {
        title: 'Menu',
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          optionList: {
            title: 'Menu',
            sections: [
              { title: 'S1', rows: [{ id: '1', title: 'O1' }] },
              { title: 'S2', rows: [{ id: '2', title: 'O2' }] },
            ],
          },
        }),
        expect.any(Object),
      );
    });
  });

  describe('sendButtonList', () => {
    it('should call httpService.post with correct params', async () => {
      const phone = '5511999999999';
      const message = 'Click a button';
      const buttons = [{ id: '1', label: 'Yes' }];
      const response = { data: { messageId: 'abc' } };

      mockHttpService.post.mockReturnValue(of(response));

      const result = await service.sendButtonList(phone, message, buttons);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.z-api.io/instances/instance-123/token/token-123/send-button-list',
        {
          phone,
          message,
          title: undefined,
          footer: undefined,
          buttonList: {
            buttons: [{ id: '1', label: 'Yes' }],
          },
        },
        {
          headers: {
            'Client-Token': 'client-token-123',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(response.data);
    });
  });
});
