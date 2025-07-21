import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { jwtSecret } from "config/jwt.secret";

@Injectable()
export class JwtService {
    constructor(
      private readonly jwtService: NestJwtService,
      private readonly configService: ConfigService
    ) {}

    private get jwtSecret(): string {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new Error('JWT_SECRET is not defined in the environment variables.');
      }
      return secret;
    }   

    sign(payload: any): string {
        return this.jwtService.sign(payload, { secret: this.jwtSecret });
    }

    signAccessToken(payload: any): string {
      return this.jwtService.sign(payload, { secret: this.jwtSecret, expiresIn: '30m' });
    }

    signRefreshToken(payload: any): string {
      return this.jwtService.sign(payload, { secret: this.jwtSecret, expiresIn: '30d' });
    }
    

   verifyAccessToken(token: string): any {
    try {
      return this.jwtService.verify(token, { secret: this.jwtSecret });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token expired');
      }
      throw new UnauthorizedException('Invalid access token');
    }
  }
  
  verifyRefreshToken(refreshToken: string): any {
    try {
      return this.jwtService.verify(refreshToken, { secret: this.jwtSecret });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

   signEmailVerificationToken(payload: any): string {
    return this.jwtService.sign(payload, { secret: this.jwtSecret, expiresIn: '1d' });
   }

   verifyEmailVerificationToken(token: string): any {
       try {
           return this.jwtService.verify(token, { secret: this.jwtSecret });
       } catch (error) {
           throw new UnauthorizedException('Invalid or expired email verification token');
       }
   }

  
  verify(token: string): any {
    return this.jwtService.verify(token, { secret: this.jwtSecret });
} 

  
  
verifyAndGetUserData(token: string): any {
  try {
      return this.jwtService.verify(token, { secret: this.jwtSecret });
  } catch (error) {
      console.error('Greška prilikom verifikacije JWT:', error);
      throw error; 
  }
}
    
      generateTokens(payload: any): { accessToken: string; refreshToken: string } {
        const accessToken = this.signAccessToken(payload);
        const refreshToken = this.signRefreshToken(payload);
        return { accessToken, refreshToken };
    }
}
