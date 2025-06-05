import { z } from 'zod';

// Schemas //

export const GetIamTokenSchema = z.object({
  yandexPassportOauthToken: z.string().optional(),
  jwt: z.string().optional(),
});

export const GetIamTokenResponseSchema = z.object({
  iamToken: z.string(),
});

// Types //

export type IGetIamToken = z.infer<typeof GetIamTokenSchema>;
export type IGetIamTokenResponse = z.infer<typeof GetIamTokenResponseSchema>;
