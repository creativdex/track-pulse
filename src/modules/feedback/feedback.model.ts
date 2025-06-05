import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateFeedbackSchema = z.object({
  username: z.string(),
  email: z.optional(z.string().email()),
  phone: z.optional(z.string()),
  message: z.string(),
});

export class CreateFeedbackDto extends createZodDto(CreateFeedbackSchema) {
  @ApiProperty({
    description: 'Имя',
    example: 'Иван Иванов',
  })
  username: string;

  @ApiProperty({
    description: 'Email',
    example: 'ivan@example.com',
    required: false,
  })
  email: string;

  @ApiProperty({
    description: 'Телефон',
    example: '+79991234567',
    required: false,
  })
  phone: string;

  @ApiProperty({
    description: 'Сообщение',
    example: 'Хороший сервис!',
  })
  message: string;
}

export type ICreateFeedback = z.infer<typeof CreateFeedbackSchema>;
