import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Gameweeks } from './gameweeks.entity';
import { Teams } from './teams.entity';
import { MatchPredictions } from './match-predictions.entity';

@Entity('matches', { schema: 'fantasy' })
export class Matches {
  @PrimaryGeneratedColumn({ type: 'int', name: 'match_id', unsigned: true })
  matchId: number;

  @Column('int', { name: 'gameweek_id', unsigned: true })
  gameweekId: number;

  @Column('int', { name: 'home_team_id', unsigned: true })
  homeTeamId: number;

  @Column('int', { name: 'away_team_id', unsigned: true })
  awayTeamId: number;

  @Column('datetime', { name: 'kickoff_time' })
  kickoffTime: Date;

  @Column('int', { name: 'home_score', nullable: true })
  homeScore: number | null;

  @Column('int', { name: 'away_score', nullable: true })
  awayScore: number | null;

  @Column('tinyint', { name: 'is_finished', width: 1, default: false })
  isFinished: boolean;

  @ManyToOne(() => Gameweeks, (gameweeks) => gameweeks.matches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'gameweek_id', referencedColumnName: 'gameweekId' }])
  gameweek: Gameweeks;

  @ManyToOne(() => Teams, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'home_team_id', referencedColumnName: 'teamId' }])
  homeTeam: Teams;

  @ManyToOne(() => Teams, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'away_team_id', referencedColumnName: 'teamId' }])
  awayTeam: Teams;

  @OneToMany(() => MatchPredictions, (mp) => mp.match)
  predictions: MatchPredictions[];
}
