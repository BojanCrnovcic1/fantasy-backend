import { Controller, Post, Get, Param, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { PredictionsService } from 'src/services/prediction/predictions.service';

@Controller('api/predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles('USER')
  async create(@Body() body: { userId: number; teamIds: number[] }) {
    const { userId, teamIds } = body;
    if (!userId || !Array.isArray(teamIds)) {
      throw new BadRequestException('Nedostaju podaci za korisnika ili timove.');
    }
    return this.predictionsService.createPrediction(userId, teamIds);
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  @Roles('USER','ADMIN')
  async getByUser(@Param('userId') userId: number) {
    return this.predictionsService.findByUser(+userId);
  }
}

