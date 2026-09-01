import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gameweeks } from '../../entities/gameweeks.entity';
import { CreateGameweekDto } from 'src/dtos/gameweek/create-gameweek.dto';

@Injectable()
export class GameweeksService {
  constructor(
    @InjectRepository(Gameweeks)
    private readonly gameweeksRepo: Repository<Gameweeks>,
  ) {}

  async create(dto: CreateGameweekDto): Promise<Gameweeks> {
    const existing = await this.gameweeksRepo.findOne({
      where: { seasonYear: dto.seasonYear, number: dto.number },
    });

    if (existing) {
      throw new BadRequestException(
        `Kolo broj ${dto.number} za ${dto.seasonYear}. godinu već postoji.`,
      );
    }

    const gameweek = this.gameweeksRepo.create(dto);
    return await this.gameweeksRepo.save(gameweek);
  }

  async findAllBySeason(seasonYear: number): Promise<Gameweeks[]> {
    return await this.gameweeksRepo.find({
      where: { seasonYear },
      order: { number: 'ASC' },
      relations: ['matches', 'matches.homeTeam', 'matches.awayTeam'],
    });
  }

  async findOne(gameweekId: number): Promise<Gameweeks> {
    const gameweek = await this.gameweeksRepo.findOne({
      where: { gameweekId },
      relations: ['matches', 'matches.homeTeam', 'matches.awayTeam'],
    });

    if (!gameweek) {
      throw new NotFoundException(
        `Kolo sa ID-em ${gameweekId} nije pronađeno.`,
      );
    }

    return gameweek;
  }

  async toggleFinish(
    gameweekId: number,
    isFinished: boolean,
  ): Promise<Gameweeks> {
    const gameweek = await this.findOne(gameweekId);
    gameweek.isFinished = isFinished;
    return await this.gameweeksRepo.save(gameweek);
  }

  async remove(gameweekId: number): Promise<void> {
    const gameweek = await this.gameweeksRepo.findOne({
      where: { gameweekId },
    });

    if (!gameweek) {
      throw new NotFoundException('Gameweek ne postoji.');
    }

    await this.gameweeksRepo.remove(gameweek);
  }
}
