import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Length } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "typefan" })
  @IsNotEmpty({ message: "用户名不能为空" })
  @Length(2, 20, { message: "用户名长度为2-20位" })
  username: string;

  @ApiProperty({ example: "15512345678" })
  @IsNotEmpty({ message: "手机号不能为空" })
  @Length(6, 20, { message: "手机号长度应在6到20位之间" })
  phone: string;

  @ApiProperty({ example: "secret123" })
  @IsNotEmpty({ message: "密码不能为空" })
  @Length(6, 64, { message: "密码长度为6-64位" })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: "15512345678" })
  @IsNotEmpty({ message: "手机号不能为空" })
  @Length(6, 20, { message: "手机号长度应在6到20位之间" })
  phone: string;

  @ApiProperty({ example: "secret123" })
  @IsNotEmpty({ message: "密码不能为空" })
  @Length(6, 64, { message: "密码长度为6-64位" })
  password: string;
}
