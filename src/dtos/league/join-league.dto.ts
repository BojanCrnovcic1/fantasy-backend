import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinLeagueDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 10)
  code: string;
}
