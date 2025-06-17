import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserTrackerRateEntity } from '../user-rate/user-rate.entity';

@Entity('users_tracker')
export class UserTrackerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column('bigint', { name: 'tracker_uid', array: true, nullable: false, unique: false })
  trackerUid: string[];

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

  @OneToMany(() => UserTrackerRateEntity, (rate) => rate.user, { cascade: true })
  rates: UserTrackerRateEntity[];
}
