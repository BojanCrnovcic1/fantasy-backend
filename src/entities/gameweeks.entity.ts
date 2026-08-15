import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Matches } from './matches.entity';

@Index('uq_gameweek_season_number', ['seasonYear', 'number'], { unique: true })
@Entity('gameweeks', { schema: 'fantasy' })
export class Gameweeks {
  @PrimaryGeneratedColumn({ type: 'int', name: 'gameweek_id', unsigned: true })
  gameweekId: number;

  @Column('int', { name: 'season_year' })
  seasonYear: number;

  @Column('int', { name: 'number' })
  number: number;

  @Column('varchar', { name: 'name', length: 50 })
  name: string;

  @Column('tinyint', { name: 'is_finished', width: 1, default: false })
  isFinished: boolean;

  @OneToMany(() => Matches, (matches) => matches.gameweek)
  matches: Matches[];
}
