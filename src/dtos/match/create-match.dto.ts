import { IsDateString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateMatchDto {
  @IsInt()
  @IsNotEmpty()
  gameweekId: number;

  @IsInt()
  @IsNotEmpty()
  homeTeamId: number;

  @IsInt()
  @IsNotEmpty()
  awayTeamId: number;

  @IsDateString()
  @IsNotEmpty()
  kickoffTime: string; // ISO date string (npr. "2025-08-15T19:00:00Z")
}
