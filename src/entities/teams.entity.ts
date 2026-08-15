import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActualStandings } from './actual-standings.entity';
import { PredictionItems } from './prediction-items.entity';
import { Matches } from './matches.entity';

@Index('name', ['name'], { unique: true })
@Index('short_name', ['shortName'], { unique: true })
@Entity('teams', { schema: 'fantasy' })
export class Teams {
  @PrimaryGeneratedColumn({ type: 'int', name: 'team_id', unsigned: true })
  teamId: number;

  @Column('varchar', { name: 'name', unique: true, length: 100 })
  name: string;

  @Column('varchar', { name: 'short_name', unique: true, length: 10 })
  shortName: string;

  @Column('varchar', { name: 'logo_url', length: 255 })
  logoUrl: string;

  @OneToOne(() => ActualStandings, (actualStandings) => actualStandings.team)
  actualStandings: ActualStandings;

  @OneToMany(() => PredictionItems, (predictionItems) => predictionItems.team)
  predictionItems: PredictionItems[];

  @OneToMany(() => Matches, (matches) => matches.homeTeam)
  homeMatches: Matches[];

  @OneToMany(() => Matches, (matches) => matches.awayTeam)
  awayMatches: Matches[];
}
