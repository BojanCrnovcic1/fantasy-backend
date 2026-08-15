import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { MatchesService } from '../../services/match/matches.service';
import { CreateMatchDto } from '../../dtos/match/create-match.dto';
import { UpdateMatchScoreDto } from '../../dtos/match/update-match-score.dto';

@Controller('api/matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  async create(@Body() dto: CreateMatchDto) {
    return await this.matchesService.create(dto);
  }

  @Get('gameweek/:gameweekId')
  async findByGameweek(@Param('gameweekId', ParseIntPipe) gameweekId: number) {
    return await this.matchesService.findByGameweek(gameweekId);
  }

  @Patch(':id/score')
  async updateScore(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMatchScoreDto,
  ) {
    return await this.matchesService.updateScore(id, dto);
  }
}
