import { Injectable, Logger } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { UserService } from '../user/user.service';
import { IUser } from '../user/models/user.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { ISyncUserResult } from './sync.model';
import { ITrackerUser } from '@src/shared/clients/ya-tracker/users/models/user.model';

@Injectable()
export class SyncService {
  protected readonly logger = new Logger(SyncService.name);
  constructor(
    protected readonly yaTrackerClient: YaTrackerClient,
    protected readonly userService: UserService,
  ) {}

  async syncUsers(): Promise<IServiceResult<ISyncUserResult>> {
    this.logger.log(`Syncing users with YaTracker`);
    let created = 0;
    let updated = 0;
    let failed = 0;
    try {
      const fetchedUsersResult = await this.yaTrackerClient.users.getUsers();
      if (!fetchedUsersResult.success) {
        this.logger.error(`Failed to fetch users from YaTracker: ${fetchedUsersResult.error.message}`);
        return { success: false, error: fetchedUsersResult.error.message };
      }

      const localUsersResult = await this.userService.findAll();
      if (!localUsersResult.success) {
        this.logger.error(`Failed to fetch local users: ${localUsersResult.error}`);
        return { success: false, error: localUsersResult.error };
      }

      const usersByLogin = new Map<string, ITrackerUser>();
      for (const user of fetchedUsersResult.data) {
        usersByLogin.set(user.login, user);
      }

      const localUsersByLogin = new Map<string, IUser>(localUsersResult.data.map((user: IUser) => [user.login, user]));

      await Promise.all(
        Array.from(usersByLogin.values()).map(async (fetchedUser) => {
          try {
            const localUser = localUsersByLogin.get(String(fetchedUser.login));

            if (!localUser) {
              this.logger.warn(`User with login ${fetchedUser.login} not found locally, creating new user`);
              const createUserResult = await this.userService.create({
                trackerUid: String(fetchedUser.uid),
                email: fetchedUser.email,
                login: fetchedUser.login,
                display: fetchedUser.display,
                roles: [], // TODO: Determine roles based on fetchedUser data
                dismissed: false,
              });
              if (!createUserResult.success) {
                this.logger.error(`Failed to create user ${fetchedUser.login}: ${createUserResult.error}`);
                failed++;
              } else {
                this.logger.log(`Created user ${fetchedUser.login}`);
                created++;
              }
            } else {
              const needUpdate =
                String(localUser.trackerUid) !== String(fetchedUser.uid) ||
                localUser.email !== fetchedUser.email ||
                localUser.login !== fetchedUser.login ||
                localUser.display !== fetchedUser.display ||
                localUser.dismissed !== false;

              if (needUpdate) {
                this.logger.log(`User ${fetchedUser.login} found locally, updating`);
                const updatedUserResult = await this.userService.update(localUser.id, {
                  trackerUid: String(fetchedUser.uid),
                  email: fetchedUser.email,
                  login: fetchedUser.login,
                  display: fetchedUser.display,
                  roles: [], // TODO: Determine roles based on fetchedUser data
                  dismissed: false,
                });
                if (!updatedUserResult.success) {
                  this.logger.error(`Failed to update user ${fetchedUser.login}: ${updatedUserResult.error}`);
                  failed++;
                } else {
                  this.logger.log(`Updated user ${fetchedUser.login}`);
                  updated++;
                }
              } else {
                this.logger.log(`User ${fetchedUser.login} не требует обновления`);
              }
            }
          } catch (err) {
            this.logger.error(`Unexpected error for user ${fetchedUser.login}: ${err}`);
            failed++;
          }
        }),
      );
    } catch (err) {
      this.logger.error(`Unexpected error in syncUsers: ${err}`);
      failed++;
    }
    return {
      success: true,
      data: {
        created,
        updated,
        failed,
      },
    };
  }
}
