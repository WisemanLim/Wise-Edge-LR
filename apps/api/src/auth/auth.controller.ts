import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

interface TokenDto {
  sub?: string;
  clearance?: 'O' | 'S' | 'C';
  roles?: string[];
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // dev 전용 토큰 발급(AUTH_DEV_LOGIN=true). prod 는 외부 IdP/SSO 연동.
  @Post('token')
  token(@Body() body: TokenDto) {
    if (process.env.AUTH_DEV_LOGIN !== 'true') {
      throw new ForbiddenException('dev login disabled (set AUTH_DEV_LOGIN=true)');
    }
    return {
      token: this.auth.issue({
        sub: body.sub ?? 'dev',
        clearance: body.clearance ?? 'O',
        roles: body.roles ?? [],
      }),
    };
  }
}
