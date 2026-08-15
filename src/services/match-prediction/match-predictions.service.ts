import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchPredictions } from '../../entities/match-predictions.entity';
import { Matches } from '../../entities/matches.entity';
import { UpsertMatchPredictionDto } from '../../dtos/match-prediction/upsert-match-prediction.dto';
import { LeagueMemberships } from 'src/entities/league-memberships.entity';

@Injectable()
export class MatchPredictionsService {
  constructor(
    @InjectRepository(MatchPredictions)
    private readonly predictionsRepo: Repository<MatchPredictions>,

    @InjectRepository(Matches)
    private readonly matchesRepo: Repository<Matches>,

    @InjectRepository(LeagueMemberships)
    private readonly membershipsRepo: Repository<LeagueMemberships>,
  ) {}

  // Unos ili izmena prognoze korisnika
  async upsertPrediction(
    userId: number,
    dto: UpsertMatchPredictionDto,
  ): Promise<MatchPredictions> {
    const match = await this.matchesRepo.findOne({
      where: { matchId: dto.matchId },
    });

    if (!match) {
      throw new NotFoundException(`Meč sa ID ${dto.matchId} ne postoji.`);
    }

    const now = new Date();
    const kickoffTime = new Date(match.kickoffTime);

    // Nakon početka utakmice ništa više nije moguće mijenjati.
    if (now >= kickoffTime) {
      throw new BadRequestException(
        'Prognoza je zaključana jer je utakmica već počela.',
      );
    }

    // Pronađi postojeću prognozu ovog korisnika za ovaj meč.
    let prediction = await this.predictionsRepo.findOne({
      where: {
        userId,
        matchId: dto.matchId,
      },
      relations: ['match'],
    });

    /*
     * BOOST LOGIKA
     *
     * Korisnik može imati samo jedan Boost u jednom kolu.
     *
     * Međutim, Boost sa utakmice može prebaciti na drugu
     * utakmicu sve dok utakmica na kojoj se Boost trenutno nalazi
     * NIJE počela.
     *
     * Ako je utakmica sa Boostom već počela, Boost je zaključan.
     */

    if (dto.isBoosted) {
      const boostedPredictions = await this.predictionsRepo
        .createQueryBuilder('prediction')
        .innerJoinAndSelect('prediction.match', 'match')
        .where('prediction.user_id = :userId', { userId })
        .andWhere('match.gameweek_id = :gameweekId', {
          gameweekId: match.gameweekId,
        })
        .andWhere('prediction.is_boosted = :isBoosted', {
          isBoosted: true,
        })
        .getMany();

      const otherBoost = boostedPredictions.find(
        (boostedPrediction) => boostedPrediction.matchId !== dto.matchId,
      );

      if (otherBoost) {
        const otherKickoffTime = new Date(otherBoost.match.kickoffTime);

        /*
         * Ako je utakmica na kojoj je trenutno Boost već počela,
         * korisnik ne može prebaciti Boost.
         */
        if (now >= otherKickoffTime) {
          throw new BadRequestException(
            'Boost je zaključan jer je utakmica na kojoj se nalazi već počela.',
          );
        }

        /*
         * Stari Boost još nije zaključan.
         *
         * Pošto korisnik sada želi Boost na novoj utakmici,
         * skidamo Boost sa stare utakmice.
         */
        otherBoost.isBoosted = false;

        await this.predictionsRepo.save(otherBoost);
      }
    }

    /*
     * Ako već postoji predikcija, ažuriramo je.
     */
    if (prediction) {
      prediction.homeScore = dto.homeScore;
      prediction.awayScore = dto.awayScore;
      prediction.isBoosted = dto.isBoosted;
    } else {
      /*
       * Ako ne postoji, kreiramo novu.
       */
      prediction = this.predictionsRepo.create({
        userId,
        matchId: dto.matchId,
        homeScore: dto.homeScore,
        awayScore: dto.awayScore,
        isBoosted: dto.isBoosted,
        pointsWon: 0,
      });
    }

    return await this.predictionsRepo.save(prediction);
  }
  // Dohvatanje sopstvenih prognoza za određeno kolo
  async getMyPredictionsForGameweek(
    userId: number,
    gameweekId: number,
  ): Promise<MatchPredictions[]> {
    return await this.predictionsRepo.find({
      where: {
        userId,
        match: { gameweekId },
      },
      relations: ['match', 'match.homeTeam', 'match.awayTeam'],
    });
  }

  // Pregled prognoza DRUGOG korisnika (prijatelja) za meč
  // Dozvoljeno SAMO ako je meč počeo (kickoffTime prošao)!
  async getUserPredictionsForGameweek(
    currentUserId: number,
    targetUserId: number,
    gameweekId: number,
  ): Promise<MatchPredictions[]> {
    const predictions = await this.predictionsRepo.find({
      where: {
        userId: targetUserId,
        match: { gameweekId },
      },
      relations: ['match', 'match.homeTeam', 'match.awayTeam'],
    });

    const now = new Date();

    // Sakrij score ako utakmica još nije počela (osim ako gleda svoje prognoze)
    return predictions.map((pred) => {
      const isKickoffPassed = now >= new Date(pred.match.kickoffTime);

      if (!isKickoffPassed && currentUserId !== targetUserId) {
        // Sakrij tačan rezultat ako utakmica još nije počela
        return {
          ...pred,
          homeScore: null,
          awayScore: null,
          isBoosted: false, // Sakriva se i boost info pre meča
        } as unknown as MatchPredictions;
      }

      return pred;
    });
  }
  async getGameweekLeaderboard(gameweekId: number) {
    const leaderboard = await this.predictionsRepo
      .createQueryBuilder('prediction')
      .innerJoin('prediction.match', 'match')
      .innerJoin('prediction.user', 'user')
      .where('match.gameweek_id = :gameweekId', {
        gameweekId,
      })
      .select('prediction.user_id', 'userId')
      .addSelect('user.team_name', 'teamName')
      .addSelect('user.first_name', 'firstName')
      .addSelect('user.last_name', 'lastName')
      .addSelect('COALESCE(SUM(prediction.points_won), 0)', 'points')
      .groupBy('prediction.user_id')
      .addGroupBy('user.team_name')
      .addGroupBy('user.first_name')
      .addGroupBy('user.last_name')
      .orderBy('points', 'DESC')
      .getRawMany();

    return leaderboard.map((player, index) => ({
      position: index + 1,
      userId: Number(player.userId),
      teamName: player.teamName,
      firstName: player.firstName,
      lastName: player.lastName,
      points: Number(player.points),
    }));
  }
  async getLeagueUserPredictionsForGameweek(
    currentUserId: number,
    leagueId: number,
    targetUserId: number,
    gameweekId: number,
  ): Promise<MatchPredictions[]> {
    // ------------------------------------------------------------
    // Provjeri da li je trenutni korisnik član lige
    // ------------------------------------------------------------

    const currentMembership = await this.membershipsRepo.findOne({
      where: {
        leagueId,
        userId: currentUserId,
      },
    });

    if (!currentMembership) {
      throw new ForbiddenException('Niste član ove lige.');
    }

    // ------------------------------------------------------------
    // Provjeri da li je korisnik čije predikcije gledamo član lige
    // ------------------------------------------------------------

    const targetMembership = await this.membershipsRepo.findOne({
      where: {
        leagueId,
        userId: targetUserId,
      },
    });

    if (!targetMembership) {
      throw new ForbiddenException('Ovaj korisnik nije član lige.');
    }

    // ------------------------------------------------------------
    // Dohvati predikcije
    // ------------------------------------------------------------

    const predictions = await this.predictionsRepo.find({
      where: {
        userId: targetUserId,
        match: {
          gameweekId,
        },
      },
      relations: ['match', 'match.homeTeam', 'match.awayTeam'],
      order: {
        match: {
          kickoffTime: 'ASC',
        },
      },
    });

    const now = new Date();

    // ------------------------------------------------------------
    // Sakrij predikciju dok utakmica nije počela
    // ------------------------------------------------------------

    return predictions.map((prediction) => {
      const kickoffPassed = now >= new Date(prediction.match.kickoffTime);

      if (!kickoffPassed && currentUserId !== targetUserId) {
        return {
          ...prediction,
          homeScore: null,
          awayScore: null,
          isBoosted: false,
        } as unknown as MatchPredictions;
      }

      return prediction;
    });
  }
  async getSeasonLeaderboard(seasonYear: number) {
    const leaderboard = await this.predictionsRepo
      .createQueryBuilder('prediction')
      .innerJoin('prediction.match', 'match')
      .innerJoin('match.gameweek', 'gameweek')
      .innerJoin('prediction.user', 'user')
      .where('gameweek.season_year = :seasonYear', {
        seasonYear,
      })
      .select('prediction.user_id', 'userId')
      .addSelect('user.team_name', 'teamName')
      .addSelect('user.first_name', 'firstName')
      .addSelect('user.last_name', 'lastName')
      .addSelect('COALESCE(SUM(prediction.points_won), 0)', 'points')
      .groupBy('prediction.user_id')
      .addGroupBy('user.team_name')
      .addGroupBy('user.first_name')
      .addGroupBy('user.last_name')
      .orderBy('points', 'DESC')
      .getRawMany();

    return leaderboard.map((player, index) => ({
      position: index + 1,
      userId: Number(player.userId),
      teamName: player.teamName,
      firstName: player.firstName,
      lastName: player.lastName,
      points: Number(player.points),
    }));
  }
}
