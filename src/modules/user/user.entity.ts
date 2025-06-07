import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRateEntity } from '../user-rate/user-rate.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'tracker_uid', type: 'bigint', nullable: false, unique: true })
  trackerUid: string;

  @Column({ nullable: true })
  display: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  login: string;

  @Column('simple-array', { default: '' })
  roles: string[];

  @Column({ type: 'boolean', default: false })
  dismissed: boolean;

  @OneToMany(() => UserRateEntity, (rate) => rate.user, { cascade: true })
  rates: UserRateEntity[];
}
