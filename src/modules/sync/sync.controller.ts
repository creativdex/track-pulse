import { Controller, HttpStatus, Post } from '@nestjs/common';
import { SyncService } from './sync.service';
import { ApiResponse } from '@nestjs/swagger';
import { SyncUserResultDto } from './sync.model';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';
import { ERoleUser } from '@src/shared/access/roles/role.enum';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    type: SyncUserResultDto,
    description: 'Sync users with YaTracker',
  })
  @ApplyGuard(EGuardType.JWT, ERoleUser.ADMIN)
  @Post('users')
  async syncUsers(): Promise<SyncUserResultDto> {
    const result = await this.syncService.syncUsers();
    if (!result.success) {
      throw new Error(`Failed to sync users: ${result.error}`);
    }
    return result.data;
  }
}
