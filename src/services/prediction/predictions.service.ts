import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Predictions } from 'src/entities/predictions.entity';
import { PredictionItems } from 'src/entities/prediction-items.entity';
import { Teams } from 'src/entities/teams.entity';
import { Users } from 'src/entities/users.entity';
import { Repository } from 'typeorm';
import { ScoresService } from '../score/scores.service';

@Injectable()
export class PredictionsService {
  constructor(
    @InjectRepository(Predictions)
    private predictionRepo: Repository<Predictions>,

    @InjectRepository(PredictionItems)
    private predictionItemsRepo: Repository<PredictionItems>,

    @InjectRepository(Teams)
    private teamsRepo: Repository<Teams>,

    @InjectRepository(Users)
    private usersRepo: Repository<Users>,

    private readonly scoresService: ScoresService 
  ) {}

  async hasPrediction(userId: number): Promise<boolean> {
    const count = await this.predictionRepo.count({ where: { userId } });
    return count > 0;
  }

  async createPrediction(userId: number, teamIds: number[]) {
    const now = new Date();
    const lockDate = new Date('2025-08-15T00:00:00Z');
    if (now >= lockDate) {
      throw new BadRequestException('Predikcije su zatvorene nakon početka sezone.');
    }
  
    if (teamIds.length !== 20) {
      throw new BadRequestException('Morate unijeti tačno 20 timova.');
    }
  
    if (new Set(teamIds).size !== teamIds.length) {
      throw new BadRequestException('Timovi u predikciji moraju biti unikatni.');
    }
  
    const user = await this.usersRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('Korisnik nije pronađen.');
  
    const alreadyExists = await this.hasPrediction(userId);
    if (alreadyExists) {
      throw new BadRequestException('Korisnik je već napravio predikciju.');
    }
  
    const prediction = this.predictionRepo.create({ userId, createdAt: new Date() });
    const savedPrediction = await this.predictionRepo.save(prediction);
  
    const predictionItems: PredictionItems[] = [];
  
    for (let i = 0; i < teamIds.length; i++) {
      const teamId = teamIds[i];
  
      const team = await this.teamsRepo.findOne({ where: { teamId } });
      if (!team) throw new NotFoundException(`Tim sa ID ${teamId} nije pronađen.`);
  
      const item = this.predictionItemsRepo.create({
        predictionId: savedPrediction.predictionId,
        teamId: teamId,
        position: i + 1,
      });
  
      predictionItems.push(item);
    }
  
    await this.predictionItemsRepo.save(predictionItems);
    await this.scoresService.calculateScores(2025);
    return { success: true, message: 'Predikcija je uspješno sačuvana.' };
  }  

  async findByUser(userId: number) {
    const prediction = await this.predictionRepo.findOne({
      where: { userId },
      relations: ['predictionItems', 'predictionItems.team'],
      order: { predictionItems: { position: 'ASC' } },
    });

    if (!prediction) throw new NotFoundException('Predikcija nije pronađena.');
    return prediction;
  }
}
