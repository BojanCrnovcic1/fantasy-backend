import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { LoginUserDTO } from 'src/dtos/user/login.user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const userLoginDto: LoginUserDTO = { email: username, password };
    return await this.authService.validateUser(
      userLoginDto.email,
      userLoginDto.password,
    );
  }
  
}