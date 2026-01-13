import { DocumentValidationPipe } from './document-validation.pipe';
import { SendDocumentDto } from '../dto/send-document.dto';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { Readable } from 'stream';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DocumentValidationPipe', () => {
  let pipe: DocumentValidationPipe;

  beforeEach(() => {
    pipe = new DocumentValidationPipe();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should block dangerous extensions', async () => {
    const dto: SendDocumentDto = {
      phone: '123',
      document: 'http://example.com/file.exe',
      extension: 'exe',
      fileName: 'file',
    };
    await expect(pipe.transform(dto)).rejects.toThrow(BadRequestException);
  });

  it('should pass valid PDF', async () => {
    const dto: SendDocumentDto = {
      phone: '123',
      document: 'http://example.com/file.pdf',
      extension: 'pdf',
      fileName: 'file',
    };

    const stream = new Readable();
    stream.push(Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d])); // %PDF-
    stream.push(null);
    (stream as any).destroy = jest.fn();

    mockedAxios.get.mockResolvedValue({
      status: 200,
      headers: {
        'content-length': '100',
        'content-type': 'application/pdf',
      },
      data: stream,
    });

    await expect(pipe.transform(dto)).resolves.toEqual(dto);
  });

  it('should fail if magic number does not match PDF', async () => {
    const dto: SendDocumentDto = {
      phone: '123',
      document: 'http://example.com/fake.pdf',
      extension: 'pdf',
      fileName: 'fake',
    };

    const stream = new Readable();
    stream.push(Buffer.from([0x00, 0x00, 0x00, 0x00])); // Invalid
    stream.push(null);
    (stream as any).destroy = jest.fn();

    mockedAxios.get.mockResolvedValue({
      status: 200,
      headers: {
        'content-length': '100',
        'content-type': 'application/pdf',
      },
      data: stream,
    });

    await expect(pipe.transform(dto)).rejects.toThrow(BadRequestException);
  });

  it('should fail if file size exceeds limit', async () => {
    const dto: SendDocumentDto = {
      phone: '123',
      document: 'http://example.com/large.pdf',
      extension: 'pdf',
      fileName: 'large',
    };

    // Mock stream to prevent implementation detail errors if called before check
    const stream = new Readable();
    (stream as any).destroy = jest.fn();

    mockedAxios.get.mockResolvedValue({
      status: 200,
      headers: {
        'content-length': (10 * 1024 * 1024 + 1).toString(),
        'content-type': 'application/pdf',
      },
      data: stream,
    });

    await expect(pipe.transform(dto)).rejects.toThrow(BadRequestException);
  });

  it('should fail if MIME type is invalid for extension', async () => {
    const dto: SendDocumentDto = {
      phone: '123',
      document: 'http://example.com/file.pdf',
      extension: 'pdf',
      fileName: 'file',
    };

    const stream = new Readable();
    (stream as any).destroy = jest.fn();

    mockedAxios.get.mockResolvedValue({
      status: 200,
      headers: {
        'content-length': '100',
        'content-type': 'text/html', // Invalid MIME for PDF
      },
      data: stream,
    });

    await expect(pipe.transform(dto)).rejects.toThrow(BadRequestException);
  });
});
