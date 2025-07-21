import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/auth/auth.guard";
import { Roles } from "src/auth/roles.decorator";
import { Teams } from "src/entities/teams.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { TeamsService } from "src/services/team/teams.service";

@Controller('api/teams')
export class TeamsController {
    constructor(
        private readonly teamsService: TeamsService,
    ) {}

    @Get()   
    async allTeam(): Promise<Teams[]> {
        return await this.teamsService.findAll();
    };

    @Get(':id')
    @UseGuards(AuthGuard)
    @Roles('USER','ADMIN')
    async findOneTeam(@Param('id') teamId: number): Promise<Teams | ApiResponse> {
        return await this.teamsService.findOne(teamId);
    };
}