import { Module } from "@nestjs/common";

import { UserLearnRecordService } from "./user-learn-record.service";

@Module({
  providers: [UserLearnRecordService],
  exports: [UserLearnRecordService],
})
export class UserLearnRecordModule {}
