import { Module } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { SyncService } from './sync.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [],
  providers: [YaTrackerClient, SyncService],
})
export class SyncModule {}
