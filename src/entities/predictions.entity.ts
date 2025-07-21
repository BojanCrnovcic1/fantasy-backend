import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PredictionItems } from "./prediction-items.entity";
import { Users } from "./users.entity";

@Index("fk_predicitions_user_id", ["userId"], {})
@Entity("predictions", { schema: "fantasy" })
export class Predictions {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "prediction_id",
    unsigned: true,
  })
  predictionId: number;

  @Column("int", { name: "user_id", unsigned: true })
  userId: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @OneToMany(
    () => PredictionItems,
    (predictionItems) => predictionItems.prediction
  )
  predictionItems: PredictionItems[];

  @ManyToOne(() => Users, (users) => users.predictions, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "userId" }])
  user: Users;
}
