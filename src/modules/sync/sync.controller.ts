import { Controller, HttpStatus, Post } from '@nestjs/common';
import { SyncService } from './sync.service';
import { ApiResponse } from '@nestjs/swagger';
import { ApiKeyRequired } from '@src/shared/access/decorators/api-key.decorator';
import { SyncUserResultDto } from './sync.model';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    type: SyncUserResultDto,
    description: 'Sync users with YaTracker',
  })
  @ApiKeyRequired()
  @Post('users')
  async syncUsers(): Promise<SyncUserResultDto> {
    const result = await this.syncService.syncUsers();
    if (!result.success) {
      throw new Error(`Failed to sync users: ${result.error}`);
    }
    return result.data;
  }
}
