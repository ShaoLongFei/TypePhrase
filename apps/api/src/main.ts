import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app/app.module";
import { appGlobalMiddleware } from "./app/useGlobal";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = [/^http:\/\/localhost(:\d+)?$/];
  if (process.env.CORS_ORIGIN_REGEX) {
    corsOrigins.push(new RegExp(process.env.CORS_ORIGIN_REGEX));
  }

  app.enableCors({
    origin: corsOrigins,
  });

  appGlobalMiddleware(app);
  const config = new DocumentBuilder()
    .setTitle("TypePhrase Swagger")
    .setDescription("The TypePhrase API description")
    .setVersion("v1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/swagger", app, document);
  await app.listen(process.env.PORT || 3001);
}

bootstrap();
