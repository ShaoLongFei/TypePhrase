import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { MasteredElementController } from "./mastered-element.controller";
import { MasteredElementService } from "./mastered-element.service";

@Module({
  imports: [AuthModule],
  providers: [MasteredElementService],
  controllers: [MasteredElementController],
})
export class MasteredElementModule {}
