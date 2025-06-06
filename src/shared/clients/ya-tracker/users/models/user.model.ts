import { z } from 'zod';

export const TrackerUserSchema = z.object({
  self: z.string(),
  uid: z.number(),
  login: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  display: z.string(),
  email: z.string(),
  trackerUid: z.number().optional(),
  passportUid: z.number().optional(),
  cloudUid: z.string().optional(),
  external: z.boolean().optional(),
  hasLicense: z.boolean().optional(),
  dismissed: z.boolean().optional(),
  useNewFilters: z.boolean().optional(),
  disableNotifications: z.boolean().optional(),
  firstLoginDate: z.string().optional(),
  lastLoginDate: z.string().optional(),
  welcomeMailSent: z.boolean().optional(),
});

export type ITrackerUser = z.infer<typeof TrackerUserSchema>;
