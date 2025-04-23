import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsNotEmpty, MaxLength } from 'class-validator';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(30, { message: 'Name must be 30 characters or less' })
  name: string;
}
