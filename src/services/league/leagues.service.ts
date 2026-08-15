import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Leagues } from 'src/entities/leagues.entity';
import { LeagueMemberships } from 'src/entities/league-memberships.entity';
import { Users } from 'src/entities/users.entity';
import { Matches } from 'src/entities/matches.entity';
import { MatchPredictions } from 'src/entities/match-predictions.entity';
import { Predictions } from 'src/entities/predictions.entity';
import { PredictionItems } from 'src/entities/prediction-items.entity';
import { Scores } from 'src/entities/scores.entity';
import { CreateLeagueDto } from 'src/dtos/league/create-league.dto';
import { JoinLeagueDto } from 'src/dtos/league/join-league.dto';

@Injectable()
export class LeaguesService {
  private readonly SEASON_LOCK_DATE = new Date('2026-08-20T00:00:00Z');
  constructor(
    @InjectRepository(Leagues)
    private readonly leagueRepository: Repository<Leagues>,

    @InjectRepository(LeagueMemberships)
    private readonly membershipRepository: Repository<LeagueMemberships>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

    @InjectRepository(Matches)
    private readonly matchRepository: Repository<Matches>,

    @InjectRepository(MatchPredictions)
    private readonly matchPredictionRepository: Repository<MatchPredictions>,

    @InjectRepository(Predictions)
    private readonly predictionRepository: Repository<Predictions>,
  ) {}

  // ============================================================
  // CREATE LEAGUE
  // ============================================================

  async createLeague(userId: number, dto: CreateLeagueDto) {
    const user = await this.userRepository.findOne({
      where: {
        userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    /*
     * Season Predictor liga se može napraviti samo
     * prije početka sezone.
     *
     * Match Predictor liga može biti napravljena tokom
     * cijele sezone.
     */
    if (dto.gameType === 'SEASON_PREDICTOR') {
      const seasonStarted = this.isSeasonStarted();

      if (seasonStarted) {
        throw new BadRequestException(
          'Season Predictor leagues cannot be created after the start of the season.',
        );
      }
    }

    let code: string | null = null;

    if (dto.type === 'PRIVATE') {
      code = await this.generateUniqueCode();
    }

    const league = this.leagueRepository.create({
      name: dto.name.trim(),
      ownerId: userId,
      type: dto.type,
      gameType: dto.gameType,
      seasonYear: dto.seasonYear,
      code,
    });

    const savedLeague = await this.leagueRepository.save(league);

    /*
     * Owner automatski postaje član lige.
     */
    const membership = this.membershipRepository.create({
      leagueId: savedLeague.leagueId,
      userId,
    });

    await this.membershipRepository.save(membership);

    return {
      leagueId: savedLeague.leagueId,
      name: savedLeague.name,
      type: savedLeague.type,
      gameType: savedLeague.gameType,
      seasonYear: savedLeague.seasonYear,
      code: savedLeague.code,
      ownerId: savedLeague.ownerId,
      joinedAt: membership.joinedAt,
      createdAt: savedLeague.createdAt,
    };
  }

  // ============================================================
  // JOIN PRIVATE LEAGUE BY CODE
  // ============================================================

  async joinLeague(userId: number, dto: JoinLeagueDto) {
    const code = dto.code.trim().toUpperCase();

    const league = await this.leagueRepository.findOne({
      where: {
        code,
      },
    });

    if (!league) {
      throw new NotFoundException('League with this code does not exist.');
    }

    const existingMembership = await this.membershipRepository.findOne({
      where: {
        leagueId: league.leagueId,
        userId,
      },
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this league.');
    }

    /*
     * Season Predictor lige se mogu pridružiti
     * samo prije početka sezone.
     */
    if (league.gameType === 'SEASON_PREDICTOR') {
      const seasonStarted = this.isSeasonStarted();

      if (seasonStarted) {
        throw new BadRequestException(
          'You cannot join a Season Predictor league after the season has started.',
        );
      }
    }

    const membership = this.membershipRepository.create({
      leagueId: league.leagueId,
      userId,
    });

    await this.membershipRepository.save(membership);

    return {
      message: 'Successfully joined league.',
      leagueId: league.leagueId,
      name: league.name,
      type: league.type,
      gameType: league.gameType,
      seasonYear: league.seasonYear,
      joinedAt: membership.joinedAt,
    };
  }

  // ============================================================
  // JOIN PUBLIC LEAGUE
  // ============================================================

  async joinPublicLeague(userId: number, leagueId: number) {
    const league = await this.leagueRepository.findOne({
      where: {
        leagueId,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found.');
    }

    if (league.type !== 'PUBLIC') {
      throw new BadRequestException(
        'This is a private league. You need a league code to join it.',
      );
    }

    const existingMembership = await this.membershipRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this league.');
    }

    /*
     * Season Predictor liga se ne mogu joinovati
     * nakon početka sezone.
     */
    if (league.gameType === 'SEASON_PREDICTOR') {
      const seasonStarted = this.isSeasonStarted();

      if (seasonStarted) {
        throw new BadRequestException(
          'You cannot join a Season Predictor league after the season has started.',
        );
      }
    }

    const membership = this.membershipRepository.create({
      leagueId,
      userId,
    });

    await this.membershipRepository.save(membership);

    return {
      message: 'Successfully joined league.',
      leagueId: league.leagueId,
      name: league.name,
      gameType: league.gameType,
      seasonYear: league.seasonYear,
      joinedAt: membership.joinedAt,
    };
  }

  // ============================================================
  // MY LEAGUES
  // ============================================================

  async getMyLeagues(userId: number) {
    const memberships = await this.membershipRepository.find({
      where: {
        userId,
      },
      relations: {
        league: true,
      },
      order: {
        joinedAt: 'DESC',
      },
    });

    return memberships.map((membership) => ({
      leagueId: membership.league.leagueId,
      name: membership.league.name,
      type: membership.league.type,
      gameType: membership.league.gameType,
      seasonYear: membership.league.seasonYear,

      /*
       * Kod vraćamo samo za private ligu.
       */
      code:
        membership.league.type === 'PRIVATE' ? membership.league.code : null,

      ownerId: membership.league.ownerId,
      joinedAt: membership.joinedAt,
      createdAt: membership.league.createdAt,
    }));
  }

  // ============================================================
  // PUBLIC LEAGUES
  // ============================================================

  async getPublicLeagues(
    userId: number,
    gameType?: 'MATCH_PREDICTOR' | 'SEASON_PREDICTOR',
    seasonYear?: number,
  ) {
    const query = this.leagueRepository
      .createQueryBuilder('league')
      .where('league.type = :type', {
        type: 'PUBLIC',
      });

    if (gameType) {
      query.andWhere('league.gameType = :gameType', {
        gameType,
      });
    }

    if (seasonYear) {
      query.andWhere('league.seasonYear = :seasonYear', {
        seasonYear,
      });
    }

    query.orderBy('league.createdAt', 'ASC');

    const leagues = await query.getMany();

    /*
     * Provjeravamo koje od javnih liga je user već joinovao.
     */
    const memberships = await this.membershipRepository.find({
      where: {
        userId,
      },
    });

    const joinedLeagueIds = new Set(
      memberships.map((membership) => membership.leagueId),
    );

    return leagues.map((league) => ({
      leagueId: league.leagueId,
      name: league.name,
      type: league.type,
      gameType: league.gameType,
      seasonYear: league.seasonYear,
      ownerId: league.ownerId,
      createdAt: league.createdAt,
      isMember: joinedLeagueIds.has(league.leagueId),
    }));
  }

  // ============================================================
  // GET SINGLE LEAGUE
  // ============================================================

  async getLeague(userId: number, leagueId: number) {
    const league = await this.leagueRepository.findOne({
      where: {
        leagueId,
      },
      relations: {
        owner: true,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found.');
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this league.');
    }

    const memberCount = await this.membershipRepository.count({
      where: {
        leagueId,
      },
    });

    return {
      leagueId: league.leagueId,
      name: league.name,
      type: league.type,
      gameType: league.gameType,
      seasonYear: league.seasonYear,

      code: league.type === 'PRIVATE' ? league.code : null,

      owner: {
        userId: league.owner.userId,
        teamName: league.owner.teamName,
        firstName: league.owner.firstName,
        lastName: league.owner.lastName,
      },

      memberCount,

      joinedAt: membership.joinedAt,
    };
  }

  // ============================================================
  // LEAGUE STANDINGS
  // ============================================================

  async getLeagueStandings(userId: number, leagueId: number) {
    const league = await this.leagueRepository.findOne({
      where: {
        leagueId,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found.');
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this league.');
    }

    if (league.gameType === 'MATCH_PREDICTOR') {
      return this.getMatchLeagueStandings(league);
    }

    return this.getSeasonLeagueStandings(league);
  }

  // ============================================================
  // SEASON PREDICTOR STANDINGS
  // ============================================================

  private async getSeasonLeagueStandings(league: Leagues) {
    const rows = await this.membershipRepository
      .createQueryBuilder('membership')
      .innerJoin('membership.user', 'user')
      .leftJoin(
        Scores,
        'score',
        `
            score.user_id = membership.user_id
            AND score.season_year = :seasonYear
          `,
        {
          seasonYear: league.seasonYear,
        },
      )
      .select([
        'membership.membership_id AS membershipId',
        'membership.user_id AS userId',
        'membership.joined_at AS joinedAt',
        'user.team_name AS teamName',
        'user.first_name AS firstName',
        'user.last_name AS lastName',
      ])
      .addSelect('COALESCE(score.total_score, 0)', 'pointsWon')
      .where('membership.league_id = :leagueId', {
        leagueId: league.leagueId,
      })
      .orderBy('pointsWon', 'DESC')
      .getRawMany();

    return rows.map((row, index) => ({
      position: index + 1,
      userId: Number(row.userId),
      teamName: row.teamName,
      firstName: row.firstName,
      lastName: row.lastName,
      pointsWon: Number(row.pointsWon),
      joinedAt: row.joinedAt,
    }));
  }

  // ============================================================
  // SEASON LEAGUE DETAILS
  // ============================================================

  async getSeasonLeagueDetails(userId: number, leagueId: number) {
    const league = await this.leagueRepository.findOne({
      where: {
        leagueId,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found.');
    }

    if (league.gameType !== 'SEASON_PREDICTOR') {
      throw new BadRequestException('This is not a Season Predictor league.');
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this league.');
    }

    const standings = await this.getSeasonLeagueStandings(league);

    const seasonStarted = await this.isSeasonStarted();

    /*
     * Prije početka sezone prediction se NE vraća.
     */
    if (!seasonStarted) {
      return {
        league: {
          leagueId: league.leagueId,
          name: league.name,
          type: league.type,
          gameType: league.gameType,
          seasonYear: league.seasonYear,
        },

        seasonStarted: false,

        standings,
      };
    }

    /*
     * Kada sezona počne, učitavamo prediction
     * svih članova lige.
     */
    const userIds = standings.map((row) => row.userId);

    if (!userIds.length) {
      return {
        league: {
          leagueId: league.leagueId,
          name: league.name,
          type: league.type,
          gameType: league.gameType,
          seasonYear: league.seasonYear,
        },

        seasonStarted: true,

        standings,
      };
    }

    const predictions = await this.predictionRepository
      .createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.predictionItems', 'item')
      .leftJoinAndSelect('item.team', 'team')
      .where('prediction.userId IN (:...userIds)', {
        userIds,
      })
      .getMany();

    /*
     * Pošto se baza resetuje svake sezone,
     * ovdje nije potrebno dodatno filtriranje
     * po seasonYear.
     */

    const predictionMap = new Map(
      predictions.map((prediction) => [prediction.userId, prediction]),
    );

    return {
      league: {
        leagueId: league.leagueId,
        name: league.name,
        type: league.type,
        gameType: league.gameType,
        seasonYear: league.seasonYear,
      },

      seasonStarted: true,

      standings: standings.map((row) => {
        const prediction = predictionMap.get(row.userId);

        return {
          ...row,

          prediction:
            prediction?.predictionItems
              ?.sort((a, b) => a.position - b.position)
              .map((item) => ({
                position: item.position,

                teamId: item.teamId,

                teamName: item.team.name,

                shortName: item.team.shortName,

                logoUrl: item.team.logoUrl,
              })) ?? [],
        };
      }),
    };
  }

  // ============================================================
  // MATCH DETAILS + LEAGUE PREDICTIONS
  // ============================================================

  async getLeagueMatch(userId: number, leagueId: number, matchId: number) {
    const league = await this.leagueRepository.findOne({
      where: {
        leagueId,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found.');
    }

    if (league.gameType !== 'MATCH_PREDICTOR') {
      throw new BadRequestException('This is not a Match Predictor league.');
    }

    const currentMembership = await this.membershipRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (!currentMembership) {
      throw new BadRequestException('You are not a member of this league.');
    }

    const match = await this.matchRepository.findOne({
      where: {
        matchId,
      },
      relations: {
        homeTeam: true,
        awayTeam: true,
        gameweek: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found.');
    }

    /*
     * Match mora pripadati istoj sezoni kao liga.
     */
    if (match.gameweek.seasonYear !== league.seasonYear) {
      throw new BadRequestException(
        'This match does not belong to the league season.',
      );
    }

    const now = new Date();

    const predictionsVisible = now >= match.kickoffTime;

    /*
     * Ako utakmica nije počela,
     * NE učitavamo predictions.
     */
    if (!predictionsVisible) {
      return {
        league: {
          leagueId: league.leagueId,
          name: league.name,
        },

        match: {
          matchId: match.matchId,

          homeTeam: {
            teamId: match.homeTeam.teamId,
            name: match.homeTeam.name,
            shortName: match.homeTeam.shortName,
            logoUrl: match.homeTeam.logoUrl,
          },

          awayTeam: {
            teamId: match.awayTeam.teamId,
            name: match.awayTeam.name,
            shortName: match.awayTeam.shortName,
            logoUrl: match.awayTeam.logoUrl,
          },

          kickoffTime: match.kickoffTime,

          homeScore: match.homeScore,

          awayScore: match.awayScore,

          isFinished: match.isFinished,
        },

        predictionsVisible: false,

        predictions: [],
      };
    }

    /*
     * Tek nakon kickoffa uzimamo članove lige.
     */
    const memberships = await this.membershipRepository.find({
      where: {
        leagueId,
      },
    });

    const memberIds = memberships.map((membership) => membership.userId);

    const predictions =
      memberIds.length > 0
        ? await this.matchPredictionRepository
            .createQueryBuilder('prediction')
            .innerJoinAndSelect('prediction.user', 'user')
            .where('prediction.match_id = :matchId', {
              matchId,
            })
            .andWhere('prediction.user_id IN (:...memberIds)', {
              memberIds,
            })
            .getMany()
        : [];

    return {
      league: {
        leagueId: league.leagueId,
        name: league.name,
      },

      match: {
        matchId: match.matchId,

        homeTeam: {
          teamId: match.homeTeam.teamId,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logoUrl: match.homeTeam.logoUrl,
        },

        awayTeam: {
          teamId: match.awayTeam.teamId,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logoUrl: match.awayTeam.logoUrl,
        },

        kickoffTime: match.kickoffTime,

        homeScore: match.homeScore,

        awayScore: match.awayScore,

        isFinished: match.isFinished,
      },

      predictionsVisible: true,

      predictions: predictions.map((prediction) => ({
        userId: prediction.userId,

        teamName: prediction.user.teamName,

        firstName: prediction.user.firstName,

        lastName: prediction.user.lastName,

        homeScore: prediction.homeScore,

        awayScore: prediction.awayScore,

        pointsWon: prediction.pointsWon,

        isBoosted: prediction.isBoosted,

        createdAt: prediction.createdAt,
      })),
    };
  }

  async getMatchLeagueDetails(userId: number, leagueId: number) {
    const league = await this.leagueRepository.findOne({
      where: {
        leagueId,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found.');
    }

    if (league.gameType !== 'MATCH_PREDICTOR') {
      throw new BadRequestException('This is not a Match Predictor league.');
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this league.');
    }

    const standings = await this.getMatchLeagueStandings(league);

    return {
      league: {
        leagueId: league.leagueId,
        name: league.name,
        type: league.type,
        gameType: league.gameType,
        seasonYear: league.seasonYear,
      },

      standings,
    };
  }

  // ============================================================
  // LEAVE LEAGUE
  // ============================================================

  async leaveLeague(userId: number, leagueId: number) {
    const league = await this.leagueRepository.findOne({
      where: {
        leagueId,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found.');
    }

    /*
     * Owner ne može napustiti svoju ligu.
     *
     * Ako želiš, kasnije možemo napraviti
     * transfer ownership funkcionalnost.
     */
    if (league.ownerId === userId) {
      throw new BadRequestException(
        'The league owner cannot leave the league.',
      );
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this league.');
    }

    await this.membershipRepository.remove(membership);

    return {
      message: 'Successfully left the league.',
    };
  }
  // ============================================================
  // MATCH LEAGUE DETAILS
  // ============================================================
  private async getMatchLeagueStandings(league: Leagues) {
    const rows = await this.membershipRepository
      .createQueryBuilder('membership')
      .innerJoin('membership.user', 'user')
      .leftJoin(
        MatchPredictions,
        'prediction',
        `
        prediction.user_id = membership.user_id
        AND prediction.created_at >= membership.joined_at
      `,
      )
      .select([
        'membership.membership_id AS membershipId',
        'membership.user_id AS userId',
        'membership.joined_at AS joinedAt',
        'user.team_name AS teamName',
        'user.first_name AS firstName',
        'user.last_name AS lastName',
      ])
      .addSelect('COALESCE(SUM(prediction.points_won), 0)', 'pointsWon')
      .where('membership.league_id = :leagueId', {
        leagueId: league.leagueId,
      })
      .groupBy('membership.membership_id')
      .addGroupBy('membership.user_id')
      .addGroupBy('membership.joined_at')
      .addGroupBy('user.team_name')
      .addGroupBy('user.first_name')
      .addGroupBy('user.last_name')
      .orderBy('pointsWon', 'DESC')
      .getRawMany();

    return rows.map((row, index) => ({
      position: index + 1,
      userId: Number(row.userId),
      teamName: row.teamName,
      firstName: row.firstName,
      lastName: row.lastName,
      pointsWon: Number(row.pointsWon),
      joinedAt: row.joinedAt,
    }));
  }

  // ============================================================
  // GET LEAGUE MEMBERS
  // ============================================================

  async getLeagueMembers(userId: number, leagueId: number) {
    const league = await this.leagueRepository.findOne({
      where: {
        leagueId,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found.');
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this league.');
    }

    const memberships = await this.membershipRepository.find({
      where: {
        leagueId,
      },
      relations: {
        user: true,
      },
      order: {
        joinedAt: 'DESC',
      },
    });

    return memberships.map((membership) => ({
      userId: membership.userId,

      teamName: membership.user.teamName,

      firstName: membership.user.firstName,

      lastName: membership.user.lastName,

      joinedAt: membership.joinedAt,

      isOwner: membership.userId === league.ownerId,
    }));
  }
  // ============================================================
  // SEASON START
  // ============================================================

  private async getSeasonStart(seasonYear: number): Promise<Date | null> {
    const result = await this.matchRepository
      .createQueryBuilder('match')
      .innerJoin('match.gameweek', 'gameweek')
      .select('MIN(match.kickoffTime)', 'seasonStart')
      .where('gameweek.seasonYear = :seasonYear', {
        seasonYear,
      })
      .getRawOne();

    if (!result?.seasonStart) {
      return null;
    }

    return new Date(result.seasonStart);
  }

  private isSeasonStarted(): boolean {
    return new Date() >= this.SEASON_LOCK_DATE;
  }
  // ============================================================
  // PRIVATE LEAGUE CODE
  // ============================================================

  private async generateUniqueCode(): Promise<string> {
    while (true) {
      const code = randomBytes(5).toString('hex').toUpperCase().slice(0, 8);

      const existing = await this.leagueRepository.findOne({
        where: {
          code,
        },
      });

      if (!existing) {
        return code;
      }
    }
  }
}
