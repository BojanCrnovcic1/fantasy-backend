import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ActualStandingsService } from 'src/services/actual-standings/actual-standings.service';
import { UpdateStandingDto } from 'src/dtos/actual-standings/update.standings.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { InitializeStandingsDto } from 'src/dtos/actual-standings/initialize.standings.dto';

@Controller('api/standings')
export class ActualStandingsController {
  constructor(
    private readonly standingsService: ActualStandingsService,
  ) {}

  @Get(':seasonYear')
  async getStandings(@Param('seasonYear') seasonYear: number) {
    return this.standingsService.getStandings(+seasonYear);
  }

  @Post('initialize')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  async initializeStandings(@Body() dto: InitializeStandingsDto) {
    return this.standingsService.initializeStandings(dto.seasonYear, dto.standings);
  }

  @Patch('update-position')
  @Roles('ADMIN')
  async updatePosition(@Body() dto: UpdateStandingDto) {
    return this.standingsService.updateTeamPosition(dto.seasonYear, dto.teamId, dto.newPosition);
  }

  @Delete(':seasonYear')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  async resetStanding(@Param('seasonYear') seasonYear: number) {
    return this.standingsService.clearStandingsForSeason(seasonYear);
  }

}
