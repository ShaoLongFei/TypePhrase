import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";

import { AuthService } from "../auth/auth.service";

export const UncheckAuth = () => SetMetadata("uncheck", true);
export const Permissions = (...permissions: string[]) => SetMetadata("permissions", permissions);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = await this.authService.findUserIdByRequest(request);
    if (!userId) {
      throw new UnauthorizedException("请先登录");
    }
    request["userId"] = userId;
    return true;
  }
}
