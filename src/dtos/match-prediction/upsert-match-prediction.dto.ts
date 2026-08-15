import { IsBoolean, IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpsertMatchPredictionDto {
  @IsInt()
  @IsNotEmpty()
  matchId: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  homeScore: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  awayScore: number;

  @IsBoolean()
  isBoosted: boolean;
}
