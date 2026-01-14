import {
  PipeTransform,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SendDocumentDto } from '../dto/send-document.dto';
import axios from 'axios';

@Injectable()
export class DocumentValidationPipe implements PipeTransform {
  private readonly logger = new Logger(DocumentValidationPipe.name);
  private readonly MAX_SIZE = 10 * 1024 * 1024; // 10MB

  private readonly BLOCKED_EXTENSIONS = [
    '.exe',
    '.bat',
    '.js',
    '.vbs',
    '.cmd',
    '.sh',
    '.msi',
    '.com',
    '.scr',
    '.pif',
    '.php',
    '.pl',
    '.py',
    '.jar',
  ];

  private readonly MAGIC_NUMBERS: Record<string, number[]> = {
    pdf: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
    docx: [0x50, 0x4b, 0x03, 0x04], // PK..
    xlsx: [0x50, 0x4b, 0x03, 0x04], // PK..
    pptx: [0x50, 0x4b, 0x03, 0x04], // PK..
    zip: [0x50, 0x4b, 0x03, 0x04], // PK..
    png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    jpg: [0xff, 0xd8, 0xff],
    jpeg: [0xff, 0xd8, 0xff],
  };

  private readonly MIME_TYPES: Record<string, string[]> = {
    pdf: ['application/pdf'],
    docx: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
    xlsx: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
    pptx: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
    ],
    png: ['image/png'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
  };

  async transform(value: SendDocumentDto) {
    if (!value) {
      return value;
    }

    // Skip validation if document is not provided (it might be filled from template later)
    if (!value.document) {
      return value;
    }

    const { document, extension } = value;
    const cleanExt = (extension || '').toLowerCase().replace(/^\./, '');
    const fileExt = `.${cleanExt}`;

    // 1. Security: Block dangerous extensions
    if (this.BLOCKED_EXTENSIONS.includes(fileExt)) {
      this.logger.warn(
        `Blocked attempt to upload dangerous extension: ${fileExt}`,
      );
      throw new BadRequestException(`Extension ${fileExt} is not allowed.`);
    }

    // 2. Validate URL
    if (this.isUrl(document)) {
      const validatedExt = await this.validateUrl(document, cleanExt);
      if (!value.extension && validatedExt) {
        value.extension = validatedExt;
      }
    }

    return value;
  }

  private isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  private async validateUrl(
    url: string,
    expectedExt: string,
  ): Promise<string | null> {
    try {
      // Use stream to avoid downloading large files entirely
      const response = await axios.get(url, {
        responseType: 'stream',
        headers: {
          Range: 'bytes=0-4096',
          'User-Agent': 'Wget/1.20', // Mimic wget to avoid HTML warning pages from some file sharing services
        },
        timeout: 5000, // 5s timeout
      });

      const headers = response.headers;
      const contentLength = parseInt(headers['content-length'] || '0', 10);
      const isPartial = response.status === 206; // Partial Content

      // Size check
      // If it's not partial, content-length is the total size.
      // If it is partial, content-range might give the total size: "bytes 0-4096/123456"
      let totalSize = contentLength;
      if (isPartial && headers['content-range']) {
        const parts = headers['content-range'].split('/');
        if (parts.length > 1) {
          totalSize = parseInt(parts[1], 10) || contentLength;
        }
      }

      if (totalSize > this.MAX_SIZE) {
        this.logger.warn(`File too large: ${totalSize} bytes`);
        response.data.destroy();
        throw new BadRequestException('File size exceeds the limit of 10MB.');
      }

      // MIME check
      const contentType = headers['content-type'];
      let finalExt = expectedExt;

      if (expectedExt && this.MIME_TYPES[expectedExt]) {
        const allowedMimes = this.MIME_TYPES[expectedExt];
        const isValidMime = allowedMimes.some((mime) =>
          contentType?.toLowerCase().includes(mime),
        );
        if (!isValidMime) {
          this.logger.warn(
            `Invalid MIME type: ${contentType} for extension ${expectedExt}`,
          );
          response.data.destroy();
          throw new BadRequestException(
            `Invalid Content-Type: ${contentType}. Expected one of: ${allowedMimes.join(', ')}`,
          );
        }
      } else if (!expectedExt) {
        finalExt = this.inferExtensionFromMime(contentType) || '';
      }

      // Magic Number check
      const magic = this.MAGIC_NUMBERS[finalExt];
      if (magic) {
        try {
          const chunk = await this.readFirstChunk(response.data);
          this.validateMagicNumber(chunk, magic, finalExt);
        } catch (e) {
          response.data.destroy();
          throw e;
        }
      }

      // Cleanup
      if (!response.data.destroyed) {
        response.data.destroy();
      }

      return finalExt;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error(`Validation failed for URL ${url}: ${error.message}`);
      throw new BadRequestException(
        `Failed to validate document: ${error.message}`,
      );
    }
  }

  private inferExtensionFromMime(contentType: string): string | null {
    if (!contentType) return null;
    const lowerType = contentType.toLowerCase();
    for (const [ext, mimes] of Object.entries(this.MIME_TYPES)) {
      if (mimes.some((mime) => lowerType.includes(mime))) {
        return ext;
      }
    }
    return null;
  }

  private readFirstChunk(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      stream.once('data', (chunk: Buffer) => {
        resolve(chunk);
      });
      stream.once('error', (err: any) => reject(err));
    });
  }

  private validateMagicNumber(buffer: Buffer, magic: number[], ext: string) {
    if (buffer.length < magic.length) {
      throw new BadRequestException('File is too short to be valid.');
    }

    for (let i = 0; i < magic.length; i++) {
      if (buffer[i] !== magic[i]) {
        throw new BadRequestException(
          `Invalid file format. Magic number mismatch for ${ext}.`,
        );
      }
    }
  }
}
