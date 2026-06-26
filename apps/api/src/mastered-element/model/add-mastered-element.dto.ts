import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AddMasteredElementDto {
  @IsIn(["statement", "sentence"])
  sourceType: "statement" | "sentence";

  @IsNotEmpty()
  @IsString()
  sourceId: string;

  @IsNotEmpty()
  @IsString()
  english: string;

  @IsOptional()
  @IsString()
  chinese?: string;
}
