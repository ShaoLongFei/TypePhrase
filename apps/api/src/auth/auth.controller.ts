import type { Request, Response } from "express";

import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../guards/auth.guard";
import { User, UserEntity } from "../user/user.decorators";
import { AuthService, SESSION_COOKIE_NAME } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";

const SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 30;

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.register(dto);
    const loginResult = await this.authService.login({
      phone: dto.phone,
      password: dto.password,
    });
    this.setSessionCookie(response, loginResult.sessionToken);
    return loginResult.user ?? user;
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    this.setSessionCookie(response, result.sessionToken);
    return result.user;
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(this.authService.getSessionTokenFromRequest(request));
    response.clearCookie(SESSION_COOKIE_NAME);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Get("me")
  async me(@User() user: UserEntity) {
    return this.authService.findPublicUser(user.userId);
  }

  private setSessionCookie(response: Response, token: string) {
    response.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }
}
