import { Module } from '@nestjs/common';
import { UserRateService } from './user-rate.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { UserRateEntity } from './user-rate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserRateEntity, UserEntity])],
  controllers: [],
  providers: [UserRateService],
})
export class UserRateModule {}
