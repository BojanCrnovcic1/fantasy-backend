import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualStandings } from '../../entities/actual-standings.entity';
import { ScoresService } from '../score/scores.service';

@Injectable()
export class ActualStandingsService {
  constructor(
    @InjectRepository(ActualStandings)
    private readonly actualStandingsRepository: Repository<ActualStandings>,
    private readonly scoresService: ScoresService,
  ) {}

  async initializeStandings(seasonYear: number, standings: { teamId: number, position: number }[]) {
    const existing = await this.actualStandingsRepository.find({ where: { seasonYear } });
    if (existing.length > 0) {
      throw new Error(`Standings for season ${seasonYear} already initialized`);
    }
  
    const entries = standings.map(item =>
      this.actualStandingsRepository.create({
        seasonYear,
        teamId: item.teamId,
        position: item.position,
      })
    );
  
    await this.actualStandingsRepository.save(entries);
    return { message: 'Standings initialized successfully' };
  }  

async updateTeamPosition(seasonYear: number, teamId: number, newPosition: number) {
  const teamToUpdate = await this.actualStandingsRepository.findOne({
    where: { seasonYear, teamId },
  });

  if (!teamToUpdate) {
    throw new NotFoundException("Tim nije pronađen u tabeli.");
  }

  const oldPosition = teamToUpdate.position;

  if (oldPosition === newPosition) {
    return teamToUpdate; 
  }

  if (newPosition < 1 || newPosition > 20) {
    throw new Error('Pozicija mora biti između 1 i 20.');
  }  

  if (newPosition < oldPosition) {
    await this.actualStandingsRepository
      .createQueryBuilder()
      .update()
      .set({ position: () => "`position` + 1" })
      .where("season_year = :seasonYear", { seasonYear })
      .andWhere("position >= :newPosition AND position < :oldPosition", {
        newPosition,
        oldPosition,
      })
      .execute();
  } else {
    await this.actualStandingsRepository
      .createQueryBuilder()
      .update()
      .set({ position: () => "`position` - 1" })
      .where("season_year = :seasonYear", { seasonYear })
      .andWhere("position <= :newPosition AND position > :oldPosition", {
        newPosition,
        oldPosition,
      })
      .execute();
  }

  teamToUpdate.position = newPosition;
  teamToUpdate.updateAt = new Date();

  await this.scoresService.calculateScores(seasonYear);

  return this.actualStandingsRepository.save(teamToUpdate);
}

  async getStandings(seasonYear: number) {
    return this.actualStandingsRepository.find({
      where: { seasonYear },
      relations: ['team'],
      order: { position: 'ASC' },
    });
  }
    

  async clearStandingsForSeason(seasonYear: number): Promise<void> {
    await this.actualStandingsRepository.delete({ seasonYear });
  }
}
