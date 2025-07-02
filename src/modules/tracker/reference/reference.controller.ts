import { Controller, Get, HttpStatus, HttpException, Param } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { TrackerReferenceService } from './reference.service';
import { TrackerQueueDto, TrackerProjectDto } from './models/reference.model';

@ApiTags('reference-tracker')
@Controller('reference-tracker')
export class TrackerReferenceController {
  constructor(private readonly trackerReferenceService: TrackerReferenceService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queues retrieved successfully',
    type: [TrackerQueueDto],
  })
  @Get('queues')
  getAllQueues(): TrackerQueueDto[] {
    const result = this.trackerReferenceService.getAllQueuesFake();

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to fetch queues', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Projects retrieved successfully',
    type: [TrackerProjectDto],
  })
  @Get('projects')
  async getAllProjects(): Promise<TrackerProjectDto[]> {
    const result = await this.trackerReferenceService.getAllProjects();

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to fetch projects', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return result.data;
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queue retrieved successfully',
    type: TrackerQueueDto,
  })
  @ApiParam({ name: 'queueKey', description: 'Queue key', example: 'ZOTA' })
  @Get('queues/:queueKey')
  async getQueueByKey(@Param('queueKey') queueKey: string): Promise<TrackerQueueDto> {
    const result = await this.trackerReferenceService.getQueueByKey(queueKey);

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to fetch queue', HttpStatus.NOT_FOUND);
    }

    return result.data;
  }
}
