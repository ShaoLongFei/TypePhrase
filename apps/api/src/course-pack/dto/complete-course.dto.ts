import { IsDateString, IsInt, IsOptional, Min } from "class-validator";

export class CompleteCourseDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  count?: number;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
