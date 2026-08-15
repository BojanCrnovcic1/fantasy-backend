import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActualStandings } from './entities/actual-standings.entity';
import { PredictionItems } from './entities/prediction-items.entity';
import { Predictions } from './entities/predictions.entity';
import { Scores } from './entities/scores.entity';
import { Teams } from './entities/teams.entity';
import { Users } from './entities/users.entity';
import { AppController } from './controllers/app.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './services/user/users.service';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { LocalStrategy } from './auth/local.strategy';
import { AuthMiddleware } from './auth/auth.middleware';
import { MailService } from './services/user/mail.service';
import { JwtService } from './auth/jwt.service';
import { AuthController } from './controllers/auth.controller';
import { AuthGuard } from './auth/auth.guard';
import { UsersController } from './controllers/api/users.controller';
import { TeamsService } from './services/team/teams.service';
import { TeamsController } from './controllers/api/teams.controller';
import { ActualStandingsController } from './controllers/api/actual-standings.controller';
import { ActualStandingsService } from './services/actual-standings/actual-standings.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PredictionsController } from './controllers/api/predictions.controller';
import { PredictionsService } from './services/prediction/predictions.service';
import { ScoresService } from './services/score/scores.service';
import { ScoresController } from './controllers/api/scores.controller';
import { Gameweeks } from './entities/gameweeks.entity';
import { LeagueMemberships } from './entities/league-memberships.entity';
import { Leagues } from './entities/leagues.entity';
import { MatchPredictions } from './entities/match-predictions.entity';
import { Matches } from './entities/matches.entity';
import { GameweeksService } from './services/gameweek/gameweeks.service';
import { GameweeksController } from './controllers/api/gameweeks.controller';
import { MatchesController } from './controllers/api/matches.controller';
import { MatchesService } from './services/match/matches.service';
import { MatchPredictionsService } from './services/match-prediction/match-predictions.service';
import { MatchPredictionsController } from './controllers/api/match-predictions.controller';
import { LeaguesController } from './controllers/api/leagues.controller';
import { LeaguesService } from './services/league/leagues.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DATABASE_HOST'),
        port: parseInt(config.get<string>('DATABASE_PORT', '3306')),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASS'),
        database: config.get<string>('DATABASE_NAME'),
        entities: [
          ActualStandings,
          Gameweeks,
          LeagueMemberships,
          Leagues,
          MatchPredictions,
          Matches,
          PredictionItems,
          Predictions,
          Scores,
          Teams,
          Users,
        ],
      }),
    }),
    TypeOrmModule.forFeature([
      ActualStandings,
      Gameweeks,
      LeagueMemberships,
      Leagues,
      MatchPredictions,
      Matches,
      PredictionItems,
      Predictions,
      Scores,
      Teams,
      Users,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15d' },
      }),
    }),
    HttpModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    TeamsController,
    ActualStandingsController,
    PredictionsController,
    ScoresController,
    GameweeksController,
    MatchesController,
    MatchPredictionsController,
    LeaguesController,
  ],
  providers: [
    UsersService,
    AuthService,
    JwtService,
    JwtStrategy,
    LocalStrategy,
    AuthMiddleware,
    AuthGuard,
    MailService,
    TeamsService,
    ActualStandingsService,
    PredictionsService,
    ScoresService,
    GameweeksService,
    MatchesService,
    MatchPredictionsService,
    LeaguesService,
    ConfigService,
  ],
  exports: [AuthService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).exclude('auth/*').forRoutes('api/*');
  }
}
