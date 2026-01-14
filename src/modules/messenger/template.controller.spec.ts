import { Test, TestingModule } from '@nestjs/testing';
import { TemplateController } from './template.controller';
import { TemplateService } from './services/template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { MessageType } from './enums/message-type.enum';

describe('TemplateController', () => {
  let controller: TemplateController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [
        {
          provide: TemplateService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TemplateController>(TemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a template', async () => {
      const dto: CreateTemplateDto = {
        name: 'Test',
        content: 'Hello',
        type: MessageType.TEXT,
      };
      mockService.create.mockResolvedValue({ id: '1', ...dto });

      expect(await controller.create(dto)).toEqual({ id: '1', ...dto });
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('should create a DOCUMENT template with filename and extension', async () => {
      const dto: CreateTemplateDto = {
        name: 'Doc Template',
        content: 'https://example.com/file.pdf',
        type: MessageType.DOCUMENT,
        filename: 'meu-arquivo',
        extension: 'pdf',
      } as any;
      mockService.create.mockResolvedValue({ id: '2', ...dto });

      expect(await controller.create(dto)).toEqual({ id: '2', ...dto });
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return an array of templates', async () => {
      const result = [{ id: '1', name: 'Test' }];
      mockService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
    });
  });
});
