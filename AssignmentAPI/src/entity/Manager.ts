import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';

import { User } from './User';

@Entity({ name: 'usermanagement' })
export class Manager {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @ManyToOne(() => User, { nullable: false, eager: true })
  @IsNotEmpty({ message: 'User is required' })
  @JoinColumn({ name: 'userID' })
  userID: User;

  @Column({ unique: true })
  @ManyToOne(() => User, { nullable: false, eager: true })
  @IsNotEmpty({ message: `Manager's user is required` })
  @JoinColumn({ name: 'managerID' })
  managerID: User;
}
