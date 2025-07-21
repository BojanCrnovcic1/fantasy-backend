import { Body, Controller, Get, Headers, Post, Query, Req, Res, UnauthorizedException } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "src/auth/auth.service";
import { JwtService } from "src/auth/jwt.service";
import { LoginUserDTO } from "src/dtos/user/login.user.dto";
import { RegisterUserDTO } from "src/dtos/user/register.user.dto";
import { Users } from "src/entities/users.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { UsersService } from "src/services/user/users.service";
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}


    @Get('/me')
    async getUserProfile(
    @Req() req: Request, 
    @Headers('authorization') authorization: string
    ): Promise<Users | ApiResponse> {
        const token = authorization?.replace(/^Bearer\s+/, '');
        if (!token) {
            return new ApiResponse('error', -1011, 'Token failed.');
        }
    
        try {
            const userData = this.jwtService.verifyAccessToken(token);
            const userId = userData.userId;
            const user = await this.usersService.userById(userId);
        
            if (!user) {
                return new ApiResponse('error', -1011, 'User not found.');
            }
        
            req.user = userId;
            return user;
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                return new ApiResponse('error', -1012, 'Access token expired.');
            }
            return new ApiResponse('error', -1011, 'Invalid token.');
        }
    }

    @Post('/login')
    async login(@Body() loginData: LoginUserDTO): Promise <{accessToken: string; refreshToken: string}> {
        return await this.authService.login(loginData);
    }

    @Post('/register')
    async registerUser(@Body() data: RegisterUserDTO): Promise<Users | ApiResponse> {
        return await this.usersService.register(data);
    }

    @Post('/refresh')
    async refreshAccessToken(
      @Body('refreshToken') refreshToken: string
    ): Promise<{ accessToken: string }> {
      try {
        const payload = this.jwtService.verifyRefreshToken(refreshToken);
        
        const userResult = await this.usersService.userById(payload.userId);
        
        if (userResult instanceof ApiResponse || !userResult) {
          throw new UnauthorizedException('User not found');
        }
    
        const newAccessToken = this.jwtService.signAccessToken({ 
          userId: userResult.userId, 
          email: userResult.email,
        });
        
        return { 
          accessToken: newAccessToken
        };
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
    }

    @Post('/verify-email')
    async verifyEmail(@Query('token') token: string, @Res() res: Response): Promise<void> {
        try {
            const decoded = this.jwtService.verifyEmailVerificationToken(token);
            const user = await this.usersService.userById(decoded.userId);

            if (!user || user instanceof ApiResponse) {
                throw new UnauthorizedException('Invalid verification token.');
            }

            if (user.isVerified) {
                res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/already-verified`);
                return;
            }

            user.isVerified = true;
            await this.usersService.updateUser(user);

            res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/login`);
        } catch (error) {
            res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/verify-error`);
        }
    }
}