import { Controller, Delete, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/auth/auth.guard";
import { Roles } from "src/auth/roles.decorator";
import { FilterUsersDto } from "src/dtos/user/filter.user.dto";
import { Users } from "src/entities/users.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { UsersService } from "src/services/user/users.service";

@Controller('api/users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    @Get('filter')
    @UseGuards(AuthGuard)
    @Roles('ADMIN')
    async filterUsers(@Query() query: FilterUsersDto): Promise<{ data: Users[]; total: number }> {
         return this.usersService.filterUsers(query);
    }

    @Get()
    @UseGuards(AuthGuard)
    @Roles('USER','ADMIN')
    async all(): Promise<Users[]> {
        return await this.usersService.allUsers();
    };

    @Get(':id')
    @UseGuards(AuthGuard)
    @Roles('USER','ADMIN')
    async userById(@Param('id') userId: number): Promise<Users | ApiResponse> {
        return await this.usersService.userById(userId);
    };

    @Delete('remove/:id')
    @UseGuards(AuthGuard)
    @Roles('USER','ADMIN')
    async removeUser(@Param('id') userId: number): Promise<Users | ApiResponse> {
        return await this.usersService.deleteUserById(userId);
    }

}