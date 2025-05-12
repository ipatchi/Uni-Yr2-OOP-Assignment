import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';

import { Role } from './Role';

import { PasswordHandler } from '../helpers/PasswordHandler';

import { Exclude } from 'class-transformer';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn()
  userID: number;

  @Column({ select: false })
  @Exclude()
  @IsString()
  @MinLength(10, { message: 'Password must be atleast 10 characters long' })
  password: string;

  @Column({ select: false })
  @Exclude()
  salt: string;

  @Column()
  @IsString()
  @MaxLength(30, { message: 'First name cannot exceed 30 characters long' })
  firstname: string;

  @Column()
  @IsString()
  @MaxLength(10, { message: 'Surname cannot exceed 30 characters long' })
  surname: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @ManyToOne(() => Role, { nullable: false, eager: true })
  @IsNotEmpty({ message: 'Role is required' })
  @JoinColumn({ name: 'roleID' })
  roleID: Role;

  @BeforeInsert()
  hashPassword() {
    if (!this.password) {
      throw new Error('Password must be provided before inserting a user.');
    }
    const { hashedPassword, salt } = PasswordHandler.hashPassword(
      this.password
    );
    this.password = hashedPassword;
    this.salt = salt;
  }
}
