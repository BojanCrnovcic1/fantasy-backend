import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Leagues } from './leagues.entity';
import { Users } from './users.entity';

@Index('uq_league_user', ['leagueId', 'userId'], { unique: true })
@Entity('league_memberships', { schema: 'fantasy' })
export class LeagueMemberships {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'membership_id',
    unsigned: true,
  })
  membershipId: number;

  @Column('int', { name: 'league_id', unsigned: true })
  leagueId: number;

  @Column('int', { name: 'user_id', unsigned: true })
  userId: number;

  @Column('timestamp', {
    name: 'joined_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joinedAt: Date;

  @ManyToOne(() => Leagues, (leagues) => leagues.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'league_id', referencedColumnName: 'leagueId' }])
  league: Leagues;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'userId' }])
  user: Users;
}
