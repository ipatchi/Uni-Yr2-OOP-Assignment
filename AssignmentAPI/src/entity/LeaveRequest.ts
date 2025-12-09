import {
  IsDate,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from "class-validator";
import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  BeforeInsert,
} from "typeorm";

import { User } from "./User";

@Entity({ name: "leaverequest" })
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  leaveRequestID: number;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @IsNotEmpty({ message: "User is required" })
  @JoinColumn({ name: "userID" })
  userID: User;

  @Column()
  @IsString()
  leaveType: string;

  @IsDate()
  @Column()
  startDate: Date;

  @IsDate()
  @Column()
  endDate: Date;

  @Column()
  @IsString()
  status: string;

  @Column()
  @IsString()
  @MaxLength(128, { message: "Reason cannot exceed 128 characters" })
  reason: string;
}
