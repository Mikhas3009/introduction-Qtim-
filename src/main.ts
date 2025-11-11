import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as YAML from 'yamljs';
import * as swaggerUi from 'swagger-ui-express';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  //@ts-ignore
  app.use(cookieParser());

  const doc = YAML.load('./docs/swagger.yml');
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(doc, {
      swaggerOptions: {
        persistAuthorization: true,
        requestInterceptor: (req: any) => {
          req.credentials = 'include';
          return req;
        },
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
