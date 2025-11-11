import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { version } from '../package.json';

export const basePath = '/service/mcp-example';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Cumulocity MCP Example')
    .setDescription('The Cumulocity MCP Example API description')
    .setVersion(version)
    .addTag('MCP Example')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.SERVER_PORT || '0', () => {
    logger.log(
      `Server running on port "${app.getHttpServer().address().port}"`,
    );
  });
}
bootstrap();
