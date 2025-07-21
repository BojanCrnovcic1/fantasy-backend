import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Predictions } from "./predictions.entity";
import { Scores } from "./scores.entity";

@Index("uq_users_email", ["email"], { unique: true })
@Index("uq_users_team_name", ["teamName"], { unique: true })
@Entity("users", { schema: "fantasy" })
export class Users {
  @PrimaryGeneratedColumn({ type: "int", name: "user_id", unsigned: true })
  userId: number;

  @Column("varchar", {
    name: "team_name",
    unique: true,
    length: 100,
    default: () => "'0'",
  })
  teamName: string;

  @Column("varchar", { name: "first_name", length: 50, default: () => "'0'" })
  firstName: string;

  @Column("varchar", { name: "last_name", length: 50, default: () => "'0'" })
  lastName: string;

  @Column("varchar", {
    name: "email",
    unique: true,
    length: 100,
    default: () => "'0'",
  })
  email: string;

  @Column("varchar", {
    name: "password_hash",
    length: 255,
    default: () => "'0'",
  })
  passwordHash: string;

  @Column("enum", {
    name: "role",
    nullable: true,
    enum: ["USER", "ADMIN"],
    default: () => "'USER'",
  })
  role: "USER" | "ADMIN" | null;

  @Column("tinyint", { name: "is_verified", width: 1, default: () => "'0'" })
  isVerified: boolean;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @OneToMany(() => Predictions, (predictions) => predictions.user)
  predictions: Predictions[];

  @OneToMany(() => Scores, (scores) => scores.user)
  scores: Scores[];
}
