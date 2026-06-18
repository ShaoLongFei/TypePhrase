import { createHash, randomBytes } from "node:crypto";
import type { Request } from "express";

import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";
import { and, eq, gt } from "drizzle-orm";

import { sessions, users } from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";

export interface RegisterDto {
  username: string;
  phone: string;
  password: string;
}

export interface LoginDto {
  phone: string;
  password: string;
}

export const SESSION_COOKIE_NAME = "typephrase_session";

@Injectable()
export class AuthService {
  constructor(@Inject(DB) private db: DbType) {}

  static hashPassword(password: string) {
    return argon2.hash(password);
  }

  static verifyPassword(hash: string, password: string) {
    return argon2.verify(hash, password);
  }

  static hashSessionToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.phone, dto.phone),
    });

    if (existingUser) {
      throw new ConflictException("手机号已注册");
    }

    const passwordHash = await AuthService.hashPassword(dto.password);
    const [user] = await this.db
      .insert(users)
      .values({
        username: dto.username,
        phone: dto.phone,
        passwordHash,
      })
      .returning();

    return this.toPublicUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.phone, dto.phone),
    });

    if (!user || !(await AuthService.verifyPassword(user.passwordHash, dto.password))) {
      throw new UnauthorizedException("手机号或密码错误");
    }

    const sessionToken = randomBytes(32).toString("base64url");
    const tokenHash = AuthService.hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await this.db
      .insert(sessions)
      .values({
        userId: user.id,
        tokenHash,
        expiresAt,
      })
      .returning();

    return {
      user: this.toPublicUser(user),
      sessionToken,
      expiresAt,
    };
  }

  async findUserIdBySessionToken(sessionToken?: string) {
    if (!sessionToken) return null;

    const session = await this.db.query.sessions.findFirst({
      where: and(
        eq(sessions.tokenHash, AuthService.hashSessionToken(sessionToken)),
        gt(sessions.expiresAt, new Date()),
      ),
    });

    return session?.userId ?? null;
  }

  async findPublicUser(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    return user ? this.toPublicUser(user) : null;
  }

  async findUserIdByRequest(request: Request) {
    return this.findUserIdBySessionToken(this.getSessionTokenFromRequest(request));
  }

  getSessionTokenFromRequest(request: Request) {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return undefined;

    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));
    return sessionCookie?.slice(SESSION_COOKIE_NAME.length + 1);
  }

  async logout(sessionToken?: string) {
    if (!sessionToken) return;

    await this.db
      .delete(sessions)
      .where(eq(sessions.tokenHash, AuthService.hashSessionToken(sessionToken)));
  }

  toPublicUser(user: typeof users.$inferSelect) {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
