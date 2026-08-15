import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Matches } from '../../entities/matches.entity';
import { MatchPredictions } from '../../entities/match-predictions.entity';
import { CreateMatchDto } from '../../dtos/match/create-match.dto';
import { UpdateMatchScoreDto } from '../../dtos/match/update-match-score.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Matches)
    private readonly matchesRepo: Repository<Matches>,

    @InjectRepository(MatchPredictions)
    private readonly predictionsRepo: Repository<MatchPredictions>,
  ) {}

  async create(dto: CreateMatchDto): Promise<Matches> {
    if (dto.homeTeamId === dto.awayTeamId) {
      throw new BadRequestException('Domaćin i gost ne mogu biti isti tim.');
    }

    const match = this.matchesRepo.create({
      gameweekId: dto.gameweekId,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      kickoffTime: new Date(dto.kickoffTime),
    });

    return await this.matchesRepo.save(match);
  }

  async findByGameweek(gameweekId: number): Promise<Matches[]> {
    return await this.matchesRepo.find({
      where: { gameweekId },
      relations: ['homeTeam', 'awayTeam'],
      order: { kickoffTime: 'ASC' },
    });
  }

  // Ažuriranje rezultata i automatsko računanje bodova svima
  async updateScore(
    matchId: number,
    dto: UpdateMatchScoreDto,
  ): Promise<Matches> {
    const match = await this.matchesRepo.findOne({
      where: { matchId },
    });

    if (!match) {
      throw new NotFoundException(`Meč sa ID ${matchId} ne postoji.`);
    }

    if (dto.homeScore < 0 || dto.awayScore < 0) {
      throw new BadRequestException('Rezultat ne može biti negativan.');
    }

    match.homeScore = dto.homeScore;
    match.awayScore = dto.awayScore;
    match.isFinished = true;

    const savedMatch = await this.matchesRepo.save(match);

    await this.calculatePointsForMatch(savedMatch);

    return savedMatch;
  }
  // Privatna metoda za detaljan obračun bodova
  private async calculatePointsForMatch(match: Matches): Promise<void> {
    if (match.homeScore === null || match.awayScore === null) {
      throw new BadRequestException('Rezultat nije postavljen.');
    }

    const predictions = await this.predictionsRepo.find({
      where: {
        matchId: match.matchId,
      },
    });

    for (const prediction of predictions) {
      prediction.pointsWon = this.calculatePoints(
        prediction,
        match.homeScore,
        match.awayScore,
      );

      await this.predictionsRepo.save(prediction);
    }
  }
  private calculatePoints(
    prediction: MatchPredictions,
    actualHome: number,
    actualAway: number,
  ): number {
    let points = 0;

    const predictedHome = prediction.homeScore;
    const predictedAway = prediction.awayScore;

    const actualDiff = actualHome - actualAway;
    const predictedDiff = predictedHome - predictedAway;

    const actualOutcome =
      actualHome > actualAway ? '1' : actualHome < actualAway ? '2' : 'X';

    const predictedOutcome =
      predictedHome > predictedAway
        ? '1'
        : predictedHome < predictedAway
          ? '2'
          : 'X';

    // 1. Tačan ishod
    if (predictedOutcome === actualOutcome) {
      points += 10;
    }

    // 2. Tačan broj golova domaćina
    if (predictedHome === actualHome) {
      points += 5;
    }

    // 3. Tačan broj golova gosta
    if (predictedAway === actualAway) {
      points += 5;
    }

    // 4. Tačna gol razlika
    if (predictedDiff === actualDiff) {
      points += 5;
    }

    // 5. Potpuno tačan rezultat
    if (predictedHome === actualHome && predictedAway === actualAway) {
      points += 5;
    }

    // Boost
    if (prediction.isBoosted) {
      points *= 2;
    }

    return points;
  }
}
