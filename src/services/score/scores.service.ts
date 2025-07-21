import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scores } from '../../entities/scores.entity';
import { Users } from '../../entities/users.entity';
import { Predictions } from '../../entities/predictions.entity';
import { ActualStandings } from '../../entities/actual-standings.entity';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Scores) private scoreRepo: Repository<Scores>,
    @InjectRepository(Predictions) private predictionRepo: Repository<Predictions>,
    @InjectRepository(ActualStandings) private standingRepo: Repository<ActualStandings>,
    @InjectRepository(Users) private userRepo: Repository<Users>
  ) {}

  async calculateScores(seasonYear: number) {
    const users = await this.userRepo.find();
    const standings = await this.standingRepo.find({ 
      where: { seasonYear },
      order: { position: 'ASC' } 
    });
  
    for (const user of users) {
      const prediction = await this.predictionRepo.findOne({
        where: { userId: user.userId },
        relations: ['predictionItems', 'predictionItems.team'] 
      });
  
      if (!prediction) continue;
  
      prediction.predictionItems.sort((a, b) => a.position - b.position);
  
      let totalScore = 0;
  
      for (const item of prediction.predictionItems) {
        const actual = standings.find(s => s.teamId === item.teamId);
        if (!actual) continue;
  
        const diff = Math.abs(actual.position - item.position);
        if (diff === 0) totalScore += 10;
        else if (diff === 1) totalScore += 5;
        else if (diff === 2) totalScore += 3;
        else if (diff === 3) totalScore += 1;
      }
  
      // 2. Bonus bodovi
      // Prvo mjesto (+20)
      const predictedWinner = prediction.predictionItems.find(i => i.position === 1);
      const actualWinner = standings.find(s => s.position === 1);
      if (predictedWinner?.teamId === actualWinner?.teamId) {
        totalScore += 20;
      }
  
      // Top 4 (+8 po timu)
      const actualTop4Ids = standings.slice(0, 4).map(s => s.teamId);
      prediction.predictionItems
        .filter(item => item.position <= 4 && actualTop4Ids.includes(item.teamId))
        .forEach(() => totalScore += 8);
  
      // Pozicije 5-7 (+7 po timu)
      const actual5to7Ids = standings.slice(4, 7).map(s => s.teamId);
      prediction.predictionItems
        .filter(item => item.position >= 5 && item.position <= 7 && actual5to7Ids.includes(item.teamId))
        .forEach(() => totalScore += 7);
  
      // Posljednja 3 (+6 po timu)
      const totalTeams = standings.length;
      prediction.predictionItems
        .filter(item => item.position >= totalTeams - 2 && standings.slice(-3).some(s => s.teamId === item.teamId))
        .forEach(() => totalScore += 6);
  
      // Sačuvaj rezultat
      let score = await this.scoreRepo.findOne({ 
        where: { userId: user.userId, seasonYear } 
      });
      
      if (!score) {
        score = this.scoreRepo.create({ 
          userId: user.userId, 
          seasonYear, 
          totalScore
        });
      } else {
        score.totalScore = totalScore;
        score.calculatedAt = new Date();
      }
  
      await this.scoreRepo.save(score);
    }
  
    return { message: 'Scores calculated successfully' };
  }

  async getTopScores(seasonYear: number) {
    return this.scoreRepo.find({
      where: { seasonYear },
      order: { totalScore: 'DESC' },
      relations: ['user']
    });
  }

  async getWorstPredictors(seasonYear: number) {
    const scores = await this.scoreRepo.find({
      where: { seasonYear },
      relations: ['user'],
    });
  
    if (scores.length === 0) return [];
  
    const minScore = Math.min(...scores.map(s => s.totalScore ?? 0));
  
    const worstUsers = scores
      .filter(s => (s.totalScore ?? 0) === minScore)
      .map(s => ({
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        totalScore: s.totalScore ?? 0,
      }));
  
    return worstUsers;
  }  
}