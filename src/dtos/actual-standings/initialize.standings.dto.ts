
import { Type } from 'class-transformer';

class StandingInput {
  teamId: number;

  position: number;
}

export class InitializeStandingsDto {
  seasonYear: number;
  @Type(() => StandingInput)
  standings: StandingInput[];
}
