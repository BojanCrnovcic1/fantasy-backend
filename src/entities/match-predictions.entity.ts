import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './users.entity';
import { Matches } from './matches.entity';

@Index('uq_user_match', ['userId', 'matchId'], { unique: true })
@Entity('match_predictions', { schema: 'fantasy' })
export class MatchPredictions {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'match_prediction_id',
    unsigned: true,
  })
  matchPredictionId: number;

  @Column('int', { name: 'user_id', unsigned: true })
  userId: number;

  @Column('int', { name: 'match_id', unsigned: true })
  matchId: number;

  @Column('int', { name: 'home_score' })
  homeScore: number;

  @Column('int', { name: 'away_score' })
  awayScore: number;

  @Column('tinyint', { name: 'is_boosted', width: 1, default: false })
  isBoosted: boolean;

  @Column('int', { name: 'points_won', default: 0 })
  pointsWon: number;

  @Column('timestamp', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'userId' }])
  user: Users;

  @ManyToOne(() => Matches, (matches) => matches.predictions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'match_id', referencedColumnName: 'matchId' }])
  match: Matches;
}
