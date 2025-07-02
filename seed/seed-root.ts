import { AppDataSource } from './data-source';
import { UserEntity } from '../src/modules/user/user.entity';
import * as bcrypt from 'bcrypt';
import { ERoleUser } from '../src/shared/access/roles/role.enum';

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seedRootUser() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);

  const plainPassword = generatePassword();
  const password = await bcrypt.hash(plainPassword, 10);

  let user = await userRepo.findOne({ where: { login: 'root' } });
  if (user) {
    user.password = password;
    user.role = ERoleUser.ADMIN;
    user.isActive = true;
    user.firstName = 'Root';
    user.lastName = 'User';
    await userRepo.save(user);
    console.log('Root user updated!');
  } else {
    user = userRepo.create({
      login: 'root',
      password,
      role: ERoleUser.ADMIN,
      isActive: true,
      firstName: 'Root',
      lastName: 'User',
    });
    await userRepo.save(user);
    console.log('Root user created!');
  }
  console.log('Login: root');
  console.log('Password:', plainPassword);
  process.exit(0);
}

seedRootUser().catch((e) => {
  console.error(e);
  process.exit(1);
});
