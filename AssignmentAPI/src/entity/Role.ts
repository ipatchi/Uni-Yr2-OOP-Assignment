import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsEnum, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { RoleName } from '../types/RoleName';

@Entity({ name: 'role' })
export class Role {
  @PrimaryGeneratedColumn()
  roleID: number;

  @Column()
  @IsNotEmpty({ message: 'Name is required' })
  @Matches(/\S/, { message: 'Name cannot be empty or whitespace' })
  @MaxLength(30, { message: 'Name must be 30 characters or less' })
  @IsEnum(RoleName, {
    message: 'Invalid role - not specified in backend program.',
  })
  name: RoleName;
}
