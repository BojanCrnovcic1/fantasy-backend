import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./users.entity";

@Index("user_id", ["userId", "seasonYear"], { unique: true })
@Entity("scores", { schema: "fantasy" })
export class Scores {
  @PrimaryGeneratedColumn({ type: "int", name: "score_id" })
  scoreId: number;

  @Column("int", { name: "user_id", unsigned: true })
  userId: number;

  @Column("int", { name: "season_year" })
  seasonYear: number;

  @Column("int", { name: "total_score", nullable: true, default: () => "'0'" })
  totalScore: number | null;

  @Column("timestamp", {
    name: "calculated_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  calculatedAt: Date | null;

  @ManyToOne(() => Users, (users) => users.scores, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "userId" }])
  user: Users;
}
