import { Injectable, Logger } from '@nestjs/common';
import { YaTrackerClient } from '@src/shared/clients/ya-tracker/ya-tracker.client';
import { UserService } from '../user/user.service';
import { IUser } from '../user/models/user.model';
import { IServiceResult } from '@src/shared/types/service-result.type';
import { ISyncUserResult } from './sync.model';

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
      const fetchedUsers = fetchedUsersResult.data;

      const localUsersResult = await this.userService.findAll();
      if (!localUsersResult.success) {
        this.logger.error(`Failed to fetch local users: ${localUsersResult.error}`);
        return { success: false, error: localUsersResult.error };
      }
      const localUsers = localUsersResult.data;

      type GroupKey = string; // email или login
      interface GroupedUser {
        email: string;
        login: string;
        display: string;
        roles: string[];
        dismissed: boolean;
        trackerUids: string[];
      }
      const grouped = new Map<GroupKey, GroupedUser>();
      for (const fetched of fetchedUsers) {
        const key = fetched.email || fetched.login;
        if (!grouped.has(key)) {
          grouped.set(key, {
            email: fetched.email,
            login: fetched.login,
            display: fetched.display,
            roles: [], // TODO: определить роли
            dismissed: false,
            trackerUids: [],
          });
        }
        grouped.get(key)!.trackerUids.push(fetched.uid.toString());
      }

      const localByEmail = new Map(localUsers.map((u) => [u.email, u]));
      const localByLogin = new Map(localUsers.map((u) => [u.login, u]));
      const usedEmails = new Set(localUsers.map((u) => u.email));
      const usedLogins = new Set(localUsers.map((u) => u.login));

      const toCreate: Array<{
        trackerUid: string[];
        email: string;
        login: string;
        display: string;
        roles: string[];
        dismissed: boolean;
      }> = [];
      const toUpdate: Array<{ user: IUser; trackerUid: string[] }> = [];
      const alreadyActual = new Set<string>();

      for (const group of grouped.values()) {
        const { email, login, display, roles, dismissed, trackerUids } = group;
        const localUser = localByEmail.get(email) || localByLogin.get(login);
        if (!localUser) {
          toCreate.push({
            trackerUid: trackerUids,
            email,
            login,
            display,
            roles,
            dismissed,
          });
          usedEmails.add(email);
          usedLogins.add(login);
          continue;
        }
        const existingUids = Array.isArray(localUser.trackerUid) ? localUser.trackerUid.map(String) : [];
        const allUids = Array.from(new Set([...existingUids, ...trackerUids]));
        if (allUids.length > existingUids.length) {
          toUpdate.push({ user: localUser, trackerUid: allUids });
        } else {
          const fieldsActual =
            localUser.display === display &&
            localUser.email === email &&
            localUser.login === login &&
            localUser.dismissed === false;
          if (fieldsActual) {
            alreadyActual.add(localUser.login);
          }
        }
      }

      for (const createData of toCreate) {
        try {
          const res = await this.userService.create({
            trackerUid: createData.trackerUid[0],
            email: createData.email,
            login: createData.login,
            display: createData.display,
            roles: createData.roles,
            dismissed: createData.dismissed,
          });
          if (res.success) {
            created++;
            this.logger.log(`Created user ${createData.login}`);
            if (createData.trackerUid.length > 1) {
              const userId = res.data?.id;
              if (userId) {
                const updateRes = await this.userService.update(userId, { trackerUid: createData.trackerUid });
                if (updateRes.success) {
                  updated++;
                  this.logger.log(`Added all trackerUids for user ${createData.login}`);
                } else {
                  failed++;
                  this.logger.error(`Failed to add all trackerUids for user ${createData.login}: ${updateRes.error}`);
                }
              }
            }
          } else {
            failed++;
            this.logger.error(`Failed to create user ${createData.login}: ${res.error}`);
          }
        } catch (err) {
          failed++;
          this.logger.error(`Exception on create user ${createData.login}: ${err}`);
        }
      }

      for (const { user, trackerUid } of toUpdate) {
        try {
          const res = await this.userService.update(user.id, { trackerUid });
          if (res.success) {
            updated++;
            this.logger.log(`Updated trackerUid for user ${user.login}`);
          } else {
            failed++;
            this.logger.error(`Failed to update trackerUid for user ${user.login}: ${res.error}`);
          }
        } catch (err) {
          failed++;
          this.logger.error(`Exception on update trackerUid for user ${user.login}: ${err}`);
        }
      }

      for (const group of grouped.values()) {
        const { email, login, display, dismissed } = group;
        const localUser = localByEmail.get(email) || localByLogin.get(login);
        if (localUser && !alreadyActual.has(localUser.login)) {
          const needUpdate =
            localUser.display !== display ||
            localUser.email !== email ||
            localUser.login !== login ||
            localUser.dismissed !== dismissed;
          if (needUpdate) {
            try {
              const res = await this.userService.update(localUser.id, {
                display,
                email,
                login,
                dismissed,
              });
              if (res.success) {
                updated++;
                this.logger.log(`Updated fields for user ${localUser.login}`);
              } else {
                failed++;
                this.logger.error(`Failed to update fields for user ${localUser.login}: ${res.error}`);
              }
            } catch (err) {
              failed++;
              this.logger.error(`Exception on update fields for user ${localUser.login}: ${err}`);
            }
          }
        }
      }
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
