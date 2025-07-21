import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Teams } from "./teams.entity";

@Index("uq_actual_standings_season_team", ["seasonYear", "teamId"], { unique: true })
@Entity("actual_standings", { schema: "fantasy" })
export class ActualStandings {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "actual_standing_id",
    unsigned: true,
  })
  actualStandingId: number;

  @Column("int", { name: "season_year" })
  seasonYear: number;

  @Column("int", {
    name: "team_id",
    unsigned: true,
  })
  teamId: number;

  @Column("int", { name: "position", default: () => "0" })
  position: number;

  @Column("timestamp", {
    name: "update_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  updateAt: Date;

  @OneToOne(() => Teams, (teams) => teams.actualStandings, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "team_id", referencedColumnName: "teamId" }])
  team: Teams;
}

