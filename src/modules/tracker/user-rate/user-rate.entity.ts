import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { UserTrackerEntity } from '../user/user.entity';
import { EUserTrackerRateType } from './models/user-rate.model';

@Entity('user_tracker_rates')
export class UserTrackerRateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  rate: number;

  @Column({ name: 'comment', nullable: true })
  comment: string;

  @Column({ name: 'type', type: 'enum', enum: EUserTrackerRateType })
  type: EUserTrackerRateType;

  @Column({ name: 'context_value', nullable: true })
  contextValue?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => UserTrackerEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserTrackerEntity;

  @Column({ name: 'user_id', nullable: false })
  userId: string;
}
