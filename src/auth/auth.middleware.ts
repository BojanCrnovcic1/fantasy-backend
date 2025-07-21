import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return next(); 
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    try {
      const user = this.jwtService.verifyAccessToken(token);
      req['user'] = user;
      return next();
    } catch (accessTokenError: any) {
      if (accessTokenError.name !== 'TokenExpiredError') {
        return next();
      }
      
      return res.status(401).json({ 
        message: 'Access token expired',
        code: -1012,
        shouldRefresh: true
      });
    }
  }
}