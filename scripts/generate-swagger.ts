
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ThrottlerModule } from '@nestjs/throttler';
import * as fs from 'fs';
import * as path from 'path';

// Controllers
import { UsersController } from '../src/modules/users/controllers/users.controller';
import { MessengerController } from '../src/modules/messenger/messenger.controller';
import { TemplateController } from '../src/modules/messenger/template.controller';

// Services (used as tokens)
import { UsersService } from '../src/modules/users/services/users.service';
import { MessengerService } from '../src/modules/messenger/services/messenger.service';
import { TemplateService } from '../src/modules/messenger/services/template.service';

console.log('Starting lightweight swagger generation...');

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  controllers: [
    UsersController,
    MessengerController,
    TemplateController
  ],
  providers: [
    {
      provide: UsersService,
      useValue: {}, // Mock implementation
    },
    {
      provide: MessengerService,
      useValue: {}, // Mock implementation
    },
    {
      provide: TemplateService,
      useValue: {}, // Mock implementation
    },
  ],
})
class SwaggerAppModule {}

async function bootstrap() {
  try {
    console.log('Creating Nest App Context...');
    // We use create instead of createApplicationContext to ensure HTTP platform is present for Swagger to inspect
    // actually create() creates a platform.
    const app = await NestFactory.create(SwaggerAppModule, { logger: ['error', 'warn'] });

    console.log('Building Swagger...');
    const config = new DocumentBuilder()
      .setTitle('Omni Messenger API')
      .setDescription(
        'API para envio de mensagens via múltiplos canais (Z-API, etc)',
      )
      .setVersion('1.0')
      .addTag('Messenger')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    
    const outputPath = path.resolve(__dirname, '../insomnia_swagger.json');
    console.log(`Writing to ${outputPath}...`);
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`Swagger JSON generated successfully.`);

    await app.close();
  } catch (error) {
    console.error('Error generating swagger:', error);
    process.exit(1);
  }
}

bootstrap();
