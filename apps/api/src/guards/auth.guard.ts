import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { jwtVerify } from "jose";

export const UncheckAuth = () => SetMetadata("uncheck", true);
export const Permissions = (...permissions: string[]) => SetMetadata("permissions", permissions);

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const uncheck = Reflect.getMetadata("uncheck", context.getHandler());
    const permissions = Reflect.getMetadata("permissions", context.getHandler());

    if (!token && uncheck) {
      request["userId"] = null;
    } else if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtVerify(token);

      const scopes = typeof payload.scope === "string" ? payload.scope.split(" ") : [];

      if (permissions) {
        if (!permissions.every((scope) => scopes.includes(scope))) {
          throw new UnauthorizedException();
        }
      }

      request["userId"] = payload.sub;
    } catch (e) {
      if (!uncheck) {
        throw new UnauthorizedException();
      }
    }
    return true;
  }

  private async jwtVerify(token) {
    const { payload } = await jwtVerify(token, this.getJwtSecret());
    return payload;
  }

  private getJwtSecret() {
    return new TextEncoder().encode(process.env.SECRET || "typephrase-dev-secret");
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
