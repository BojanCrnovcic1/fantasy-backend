import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Teams } from "src/entities/teams.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { Repository } from "typeorm";

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(Teams) private readonly teamsRepository: Repository<Teams>,
    ) {}

    async findAll(): Promise<Teams[]> {
        return await this.teamsRepository.find({
            relations: ['actualStandings', 'predictionItems']
        });
    };

    async findOne(temaId: number): Promise<Teams | ApiResponse> {
        const team = await this.teamsRepository.findOne({
            where: {teamId: temaId},
            relations: ['actualStandings', 'predictionItems']
        });

        if (!team) {
            return new ApiResponse('error', -2001, 'Team not fund!')
        }

        return team;
    }
}