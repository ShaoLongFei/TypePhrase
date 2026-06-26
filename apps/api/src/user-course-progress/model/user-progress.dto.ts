import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty } from "class-validator";

export class CreateUserProgressDto {
  @ApiProperty()
  @IsNotEmpty({ message: "课程不能为空" })
  courseId: string;
}

export class UpsertUserProgressDto {
  @ApiProperty()
  @IsNotEmpty({ message: "课程不能为空" })
  courseId: string;

  @ApiProperty()
  @IsNotEmpty({ message: "课程包不能为空" })
  coursePackId: string;

  @ApiProperty()
  @IsNotEmpty({ message: "课程进度不能为空" })
  practiceIndex: number;

  @ApiProperty({ enum: ["normal", "hard"] })
  @IsIn(["normal", "hard"])
  difficulty: "normal" | "hard";
}
