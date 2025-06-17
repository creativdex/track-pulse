import { Module } from '@nestjs/common';
import { UserTrackerRateService } from './user-rate.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTrackerRateEntity } from './user-rate.entity';
import { UserTrackerRateController } from './user-rate.controller';
import { UserTrackerEntity } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserTrackerRateEntity, UserTrackerEntity])],
  controllers: [UserTrackerRateController],
  providers: [UserTrackerRateService],
})
export class UserTrackerRateModule {}
