import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RegisterUserDTO } from "src/dtos/user/register.user.dto";
import { Users } from "src/entities/users.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import { JwtService } from "src/auth/jwt.service";
import { MailService } from "./mail.service";
import { ConfigService } from "@nestjs/config";
import { FilterUsersDto } from "src/dtos/user/filter.user.dto";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(Users) private readonly usersRepository: Repository<Users>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    ) {}

    async filterUsers(filter: FilterUsersDto): Promise<{ data: Users[]; total: number }> {
        const { page = 1, limit = 10, email, firstName, lastName, teamName } = filter;
      
        const qb = this.usersRepository.createQueryBuilder("user");
      
        if (email) {
          qb.andWhere("user.email LIKE :email", { email: `%${email}%` });
        }
      
        if (firstName) {
          qb.andWhere("user.firstName LIKE :firstName", { firstName: `%${firstName}%` });
        }
      
        if (lastName) {
          qb.andWhere("user.lastName LIKE :lastName", { lastName: `%${lastName}%` });
        }
      
        if (teamName) {
          qb.andWhere("user.teamName LIKE :teamName", { teamName: `%${teamName}%` });
        }
      
        qb.skip((page - 1) * limit).take(limit);
      
        const [data, total] = await qb.getManyAndCount();
      
        return { data, total };
    };
      

    async allUsers(): Promise<Users[]> {
        return await this.usersRepository.find({
            relations: ['predictions','predictions.predictionItems', 'scores']
        })
    };

    async userById(userId: number): Promise<Users | ApiResponse> {
        const user = await this.usersRepository.findOne({
            where: {userId: userId},
            relations: ['predictions', 'predictions.predictionItems','scores']
        });
        if (!user) {
            return new ApiResponse('error', -1001, 'User not found.')
        }

        return user;
    };

    async getUserEmail(email: string): Promise<Users | undefined> {
        const user = await this.usersRepository.findOne({where: {email: email}});
        if (user) {
            return user;
        }
        return undefined;
    };

    async updateUser(user: Users): Promise<Users> {
        return await this.usersRepository.save(user);
    };

    async register(registerData: RegisterUserDTO): Promise<Users | ApiResponse> {
        const user = await this.getUserEmail(registerData.email);
        if (user) {
            return new ApiResponse('error', -1002, 'User already exist!')
        }

        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(registerData.password);
        const passwordHashString = passwordHash.digest('hex').toUpperCase();

        const newUser = new Users();
        newUser.teamName = registerData.teamName
        newUser.firstName = registerData.firstName;
        newUser.lastName = registerData.lastName;
        newUser.email = registerData.email;
        newUser.passwordHash = passwordHashString;
        newUser.isVerified = false;
         
        const savedUser = await this.usersRepository.save(newUser);

        if (!savedUser) {
            return new ApiResponse('error', -1003, 'User is not saved!')
        };

        const verificationToken = this.jwtService.signEmailVerificationToken({ userId: savedUser.userId, email: savedUser.email })

        const backendUrl = this.configService.get<string>('BACKEND_URL');
        const verificationLink = `${backendUrl}/auth/verify-email?token=${verificationToken}`;

        await this.mailService.sendVerificationEmail(savedUser.email, verificationLink);

        return savedUser;
    };

    async deleteUserById(userId: number): Promise<ApiResponse> {
        const user = await this.usersRepository.findOne({ where: { userId: userId } });
    
        if (!user) {
            return new ApiResponse('error', -1001, 'User not found!');
        }
    
        try {
            await this.usersRepository.remove(user);
            return new ApiResponse('ok', 0, `User with ID ${userId} deleted successfully.`);
        } catch (error) {
            return new ApiResponse('error', -1003, 'Failed to delete user.');
        }
    };       
}