import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './feedback.model';
import { ApiResponse } from '@nestjs/swagger';
import { ApiKeyRequired } from '@src/shared/access/decorators/api-key.decorator';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Feedback created successfully',
  })
  @ApiKeyRequired()
  @Post()
  async createFeedback(@Body() body: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(body);
  }
}
