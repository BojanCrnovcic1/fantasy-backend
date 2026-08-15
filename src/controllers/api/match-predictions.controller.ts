import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { MatchPredictionsService } from '../../services/match-prediction/match-predictions.service';
import { UpsertMatchPredictionDto } from '../../dtos/match-prediction/upsert-match-prediction.dto';

@Controller('api/match-predictions')
export class MatchPredictionsController {
  constructor(private readonly predictionsService: MatchPredictionsService) {}

  @Post()
  async upsertPrediction(
    @Req() req: any,
    @Body() dto: UpsertMatchPredictionDto,
  ) {
    // Proveri pod kojim ključem tvoj AuthMiddleware čuva ulogovanog usera:
    const userId =
      req.token?.userId || req.user?.userId || req.token?.id || req.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Korisnik nije autentifikovan ili token ne sadrži ID.',
      );
    }

    return await this.predictionsService.upsertPrediction(userId, dto);
  }

  @Get('my/gameweek/:gameweekId')
  async getMyPredictions(
    @Req() req: any,
    @Param('gameweekId', ParseIntPipe) gameweekId: number,
  ) {
    const userId =
      req.token?.userId || req.user?.userId || req.token?.id || req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Korisnik nije autentifikovan.');
    }

    return await this.predictionsService.getMyPredictionsForGameweek(
      userId,
      gameweekId,
    );
  }

  @Get('user/:targetUserId/gameweek/:gameweekId')
  async getUserPredictions(
    @Req() req: any,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Param('gameweekId', ParseIntPipe) gameweekId: number,
  ) {
    const currentUserId =
      req.token?.userId || req.user?.userId || req.token?.id || req.user?.id;
    return await this.predictionsService.getUserPredictionsForGameweek(
      currentUserId,
      targetUserId,
      gameweekId,
    );
  }
  @Get('league/:leagueId/user/:targetUserId/gameweek/:gameweekId')
  async getLeagueUserPredictions(
    @Req() req: any,

    @Param('leagueId', ParseIntPipe)
    leagueId: number,

    @Param('targetUserId', ParseIntPipe)
    targetUserId: number,

    @Param('gameweekId', ParseIntPipe)
    gameweekId: number,
  ) {
    const currentUserId =
      req.token?.userId || req.user?.userId || req.token?.id || req.user?.id;

    if (!currentUserId) {
      throw new UnauthorizedException('Korisnik nije autentifikovan.');
    }

    return await this.predictionsService.getLeagueUserPredictionsForGameweek(
      currentUserId,
      leagueId,
      targetUserId,
      gameweekId,
    );
  }
  @Get('leaderboard/gameweek/:gameweekId')
  async getGameweekLeaderboard(
    @Param('gameweekId', ParseIntPipe) gameweekId: number,
  ) {
    return await this.predictionsService.getGameweekLeaderboard(gameweekId);
  }
  @Get('leaderboard/season/:seasonYear')
  async getSeasonLeaderboard(
    @Param('seasonYear', ParseIntPipe) seasonYear: number,
  ) {
    return await this.predictionsService.getSeasonLeaderboard(seasonYear);
  }
}
