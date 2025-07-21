import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ScoresService } from 'src/services/score/scores.service';

@Controller('api/scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post(':seasonYear/calculate')
  @UseGuards(AuthGuard)
  @Roles('USER','ADMIN')
  async calculate(@Param('seasonYear') seasonYear: number) {
    return this.scoresService.calculateScores(+seasonYear);
  }

  @Get(':seasonYear/top')
  @UseGuards(AuthGuard)
  @Roles('USER','ADMIN')
  async getTop(@Param('seasonYear') seasonYear: number) {
    return this.scoresService.getTopScores(+seasonYear);
  }

  @Get(':seasonYear/worst')
  @UseGuards(AuthGuard)
  @Roles('USER','ADMIN')
  async getWorst(@Param('seasonYear') seasonYear: number) {
    return this.scoresService.getWorstPredictors(+seasonYear);
  }
}
