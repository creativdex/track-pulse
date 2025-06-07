import { Controller, HttpStatus, Post } from '@nestjs/common';
import { SyncService } from './sync.service';
import { ApiResponse } from '@nestjs/swagger';
import { ApiKeyRequired } from '@src/shared/access/decorators/api-key.decorator';
import { ISyncUserResult } from './sync.model';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sync users with YaTracker',
  })
  @ApiKeyRequired()
  @Post('users')
  async syncUsers(): Promise<ISyncUserResult> {
    const result = await this.syncService.syncUsers();
    if (!result.success) {
      throw new Error(`Failed to sync users: ${result.error}`);
    }
    return result.data;
  }
}
