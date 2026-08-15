import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './users.entity';
import { LeagueMemberships } from './league-memberships.entity';

@Index('uq_league_code', ['code'], { unique: true })
@Entity('leagues', { schema: 'fantasy' })
export class Leagues {
  @PrimaryGeneratedColumn({ type: 'int', name: 'league_id', unsigned: true })
  leagueId: number;

  @Column('varchar', { name: 'name', length: 100 })
  name: string;

  @Column('int', { name: 'owner_id', unsigned: true })
  ownerId: number;

  @Column('enum', {
    name: 'type',
    enum: ['PUBLIC', 'PRIVATE'],
    default: 'PRIVATE',
  })
  type: 'PUBLIC' | 'PRIVATE';

  @Column({
    name: 'game_type',
    type: 'enum',
    enum: ['MATCH_PREDICTOR', 'SEASON_PREDICTOR'],
    default: 'MATCH_PREDICTOR',
  })
  gameType: 'MATCH_PREDICTOR' | 'SEASON_PREDICTOR';

  @Column('int', { name: 'season_year' })
  seasonYear: number;

  @Column('varchar', { name: 'code', nullable: true, length: 10 })
  code: string | null;

  @Column('timestamp', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'owner_id', referencedColumnName: 'userId' }])
  owner: Users;

  @OneToMany(() => LeagueMemberships, (lm) => lm.league)
  memberships: LeagueMemberships[];
}
