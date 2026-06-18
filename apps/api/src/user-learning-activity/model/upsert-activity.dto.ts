import { Type } from "class-transformer";
import { IsDate, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from "class-validator";

export class UpsertActivityDto implements Extracted {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNotEmpty()
  @IsString()
  activityType: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  duration: number;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

interface Extracted {
  date: Date;
  activityType: string;
  duration: number;
  courseId?: string;
  metadata?: Record<string, unknown>;
}
