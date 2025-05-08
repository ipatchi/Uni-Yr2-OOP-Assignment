import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsNotEmpty, Matches, MaxLength } from 'class-validator';

@Entity({ name: 'role' })
export class Role {
  @PrimaryGeneratedColumn()
  roleID: number;

  @Column()
  @IsNotEmpty({ message: 'Name is required' })
  @Matches(/\S/, { message: 'Name cannot be empty or whitespace' })
  @MaxLength(30, { message: 'Name must be 30 characters or less' })
  name: string;
}
