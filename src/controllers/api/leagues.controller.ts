import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CreateLeagueDto } from 'src/dtos/league/create-league.dto';
import { JoinLeagueDto } from 'src/dtos/league/join-league.dto';
import { LeaguesService } from 'src/services/league/leagues.service';

@Controller('api/leagues')
export class LeaguesController {
  constructor(private readonly leagueService: LeaguesService) {}

  // ============================================================
  // CREATE
  // ============================================================

  @Post()
  @UseGuards(AuthGuard)
  @Roles('USER', 'ADMIN')
  createLeague(@Req() req, @Body() dto: CreateLeagueDto) {
    return this.leagueService.createLeague(req.user.userId, dto);
  }

  // ============================================================
  // JOIN PRIVATE BY CODE
  // ============================================================

  @Post('join/code')
  @UseGuards(AuthGuard)
  @Roles('USER', 'ADMIN')
  joinLeague(@Req() req, @Body() dto: JoinLeagueDto) {
    return this.leagueService.joinLeague(req.user.userId, dto);
  }

  // ============================================================
  // JOIN PUBLIC
  // ============================================================

  @Post(':leagueId/join')
  @UseGuards(AuthGuard)
  @Roles('USER', 'ADMIN')
  joinPublicLeague(
    @Req() req,
    @Param('leagueId', ParseIntPipe)
    leagueId: number,
  ) {
    return this.leagueService.joinPublicLeague(req.user.userId, leagueId);
  }

  // ============================================================
  // MY LEAGUES
  // ============================================================

  @Get('my')
  @UseGuards(AuthGuard)
  @Roles('USER', 'ADMIN')
  getMyLeagues(@Req() req) {
    return this.leagueService.getMyLeagues(req.user.userId);
  }

  // ============================================================
  // PUBLIC LEAGUES
  // ============================================================

  @Get('public')
  @UseGuards(AuthGuard)
  @Roles('USER', 'ADMIN')
  getPublicLeagues(
    @Req() req,

    @Query('gameType')
    gameType?: 'MATCH_PREDICTOR' | 'SEASON_PREDICTOR',

    @Query('seasonYear')
    seasonYear?: string,
  ) {
    return this.leagueService.getPublicLeagues(
      req.user.userId,

      gameType,

      seasonYear ? Number(seasonYear) : undefined,
    );
  }

  // ============================================================
  // SINGLE LEAGUE
  // ============================================================

  @Get(':leagueId')
  @UseGuards(AuthGuard)
  @Roles('USER', 'ADMIN')
  getLeague(
    @Req() req,

    @Param('leagueId', ParseIntPipe)
    leagueId: number,
  ) {
    return this.leagueService.getLeague(req.user.userId, leagueId);
  }

  // ============================================================
  // STANDINGS
  // ============================================================

  @Get(':leagueId/standings')
  @UseGuards(AuthGuard)
  @Roles('USER', 'ADMIN')
  getLeagueStandings(
    @Req() req,

    @Param('leagueId', ParseIntPipe)
    leagueId: number,
  ) {
    return this.leagueService.getLeagueStandings(req.user.userId, leagueId);
  }

  // ============================================================
  // SEASON LEAGUE
  // ============================================================

  @Get(':leagueId/season')
  @UseGuards(AuthGuard)
  @Roles('USER', 'ADMIN')
  getSeasonLeagueDetails(
    @Req() req,

    @Param('leagueId', ParseIntPipe)
    leagueId: number,
  ) {
    return this.leagueService.getSeasonLeagueDetails(req.user.userId, leagueId);
  }

  // ============================================================
  // LEAGUE MEMBERS
  // ============================================================

  @Get(':leagueId/members')
  @UseGuards(AuthGuard)
  @Roles('USER', 'ADMIN')
  getLeagueMembers(
    @Req() req,

    @Param('leagueId', ParseIntPipe)
    leagueId: number,
  ) {
    return this.leagueService.getLeagueMembers(req.user.userId, leagueId);
  }

  // ============================================================
  // MATCH + LEAGUE PREDICTIONS
  // ============================================================

  @Get(':leagueId/matches/:matchId')
  getLeagueMatch(
    @Req() req,

    @Param('leagueId', ParseIntPipe)
    leagueId: number,

    @Param('matchId', ParseIntPipe)
    matchId: number,
  ) {
    return this.leagueService.getLeagueMatch(
      req.user.userId,
      leagueId,
      matchId,
    );
  }
  @Get(':leagueId/match-details')
  async getMatchLeagueDetails(
    @Req() req: any,
    @Param('leagueId', ParseIntPipe) leagueId: number,
  ) {
    const userId =
      req.token?.userId || req.user?.userId || req.token?.id || req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Korisnik nije autentifikovan.');
    }

    return await this.leagueService.getMatchLeagueDetails(userId, leagueId);
  }

  // ============================================================
  // LEAVE
  // ============================================================

  @Delete(':leagueId/leave')
  leaveLeague(
    @Req() req,

    @Param('leagueId', ParseIntPipe)
    leagueId: number,
  ) {
    return this.leagueService.leaveLeague(req.user.userId, leagueId);
  }
}
