import { Injectable, Logger } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { ICreateFeedback } from './feedback.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeedbackService {
  protected readonly logger: Logger;

  constructor(
    protected readonly yaTrackerClient: YaTrackerClient,
    protected readonly configService: ConfigService,
  ) {
    this.logger = new Logger(FeedbackService.name);
  }

  async createFeedback(payload: ICreateFeedback) {
    this.logger.log(`Creating feedback: ${payload.username}`);

    const message = [
      `Имя: ${payload.username}`,
      payload.phone && `Телефон: ${payload.phone}`,
      payload.email && `Email: ${payload.email}`,
      `Сообщение: ${payload.message}`,
    ]
      .filter(Boolean)
      .join('\n');

    const result = await this.yaTrackerClient.tasks.createTask({
      queue: this.configService.getOrThrow<string>('ENV__YA_TRACKER_QUEUE'),
      summary: 'Запрос с сайта',
      description: message,
      type: 'request',
      priority: 'normal',
    });

    if (result.success) {
      this.logger.log(`Feedback created: ${result.data.id}`);
    } else {
      this.logger.error(`Error creating feedback: ${result.error.message}`);
    }

    return result;
  }
}
