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
} from 'typeorm';
import { Role } from './Role';
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

  @IsString()
  @MaxLength(30, { message: 'First name cannot exceed 30 characters long' })
  firstname: string;

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
}
