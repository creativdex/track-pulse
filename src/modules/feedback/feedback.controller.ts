import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './feedback.model';
import { ApiResponse } from '@nestjs/swagger';
import { ApplyGuard } from '@src/shared/access/decorators/apply-guard.decorator';
import { EGuardType } from '@src/shared/access/guard-type.enum';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Feedback created successfully',
  })
  @ApplyGuard(EGuardType.API_KEY)
  @Post()
  async createFeedback(@Body() body: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(body);
  }
}
