import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateGameweekDto {
  @IsInt()
  @Min(2020)
  seasonYear: number;

  @IsInt()
  @Min(1)
  number: number;

  @IsString()
  @IsNotEmpty()
  name: string;
}
