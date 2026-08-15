import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateLeagueDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsEnum(['PUBLIC', 'PRIVATE'])
  type: 'PUBLIC' | 'PRIVATE';

  @IsEnum(['MATCH_PREDICTOR', 'SEASON_PREDICTOR'])
  gameType: 'MATCH_PREDICTOR' | 'SEASON_PREDICTOR';

  @IsInt()
  @Min(2000)
  seasonYear: number;
}
