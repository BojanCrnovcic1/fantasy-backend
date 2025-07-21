import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Teams } from "./teams.entity";
import { Predictions } from "./predictions.entity";

@Index("fk_predicitions_items_team_id", ["teamId"], {})
@Index("fk_predictions_items_prediction_id", ["predictionId"], {})
@Entity("prediction_items", { schema: "fantasy" })
export class PredictionItems {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "prediction_item_id",
    unsigned: true,
  })
  predictionItemId: number;

  @Column("int", {
    name: "prediction_id",
    unsigned: true,
    default: () => "'0'",
  })
  predictionId: number;

  @Column("int", { name: "team_id", unsigned: true, default: () => "'0'" })
  teamId: number;

  @Column("int", { name: "position", unsigned: true, default: () => "'0'" })
  position: number;

  @ManyToOne(() => Teams, (teams) => teams.predictionItems, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "team_id", referencedColumnName: "teamId" }])
  team: Teams;

  @ManyToOne(() => Predictions, (predictions) => predictions.predictionItems, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "prediction_id", referencedColumnName: "predictionId" }])
  prediction: Predictions;
}
