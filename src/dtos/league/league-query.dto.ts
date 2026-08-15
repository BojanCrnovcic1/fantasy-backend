import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class LeagueQueryDto {
  @IsOptional()
  @IsEnum(['MATCH_PREDICTOR', 'SEASON_PREDICTOR'])
  gameType?: 'MATCH_PREDICTOR' | 'SEASON_PREDICTOR';

  @IsOptional()
  @IsInt()
  @Min(2000)
  seasonYear?: number;
}
