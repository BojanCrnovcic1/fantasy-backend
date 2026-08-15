import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { GameweeksService } from '../../services/gameweek/gameweeks.service';
import { CreateGameweekDto } from '../../dtos/gameweek/create-gameweek.dto';

@Controller('api/gameweeks')
export class GameweeksController {
  constructor(private readonly gameweeksService: GameweeksService) {}

  @Post()
  async create(@Body() dto: CreateGameweekDto) {
    return await this.gameweeksService.create(dto);
  }

  @Get('season/:year')
  async findAllBySeason(@Param('year', ParseIntPipe) year: number) {
    return await this.gameweeksService.findAllBySeason(year);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.gameweeksService.findOne(id);
  }

  @Patch(':id/finish')
  async toggleFinish(
    @Param('id', ParseIntPipe) id: number,
    @Body('isFinished') isFinished: boolean,
  ) {
    return await this.gameweeksService.toggleFinish(id, isFinished);
  }
}
