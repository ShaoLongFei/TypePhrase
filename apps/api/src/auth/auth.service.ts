import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { hash, verify } from "argon2";
import { SignJWT } from "jose";

import { users } from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";
import { LoginDto, RegisterDto } from "./model/auth.dto";

@Injectable()
export class AuthService {
  constructor(@Inject(DB) private db: DbType) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.findByPhone(dto.phone);
    if (existingUser) {
      throw new ConflictException("手机号已注册");
    }

    const [user] = await this.db
      .insert(users)
      .values({
        username: dto.username,
        phone: dto.phone,
        passwordHash: await hash(dto.password),
        avatar: "",
      })
      .returning();

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.findByPhone(dto.phone);
    if (!user || !(await verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException("手机号或密码错误");
    }

    return this.createAuthResponse(user);
  }

  private async findByPhone(phone: string) {
    return this.db.query.users.findFirst({
      where: eq(users.phone, phone),
    });
  }

  private async createAuthResponse(user: typeof users.$inferSelect) {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(this.getJwtSecret());

    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  private getJwtSecret() {
    return new TextEncoder().encode(process.env.SECRET || "typephrase-dev-secret");
  }

  private toPublicUser(user: typeof users.$inferSelect) {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
