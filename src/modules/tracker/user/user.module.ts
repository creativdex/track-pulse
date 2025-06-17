import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTrackerService } from './user.service';
import { UserTrackerEntity } from './user.entity';
import { UserTrackerController } from './user.controler';

@Module({
  imports: [TypeOrmModule.forFeature([UserTrackerEntity])],
  controllers: [UserTrackerController],
  providers: [UserTrackerService],
  exports: [UserTrackerService],
})
export class UserTrackerModule {}
