import { validate } from 'class-validator';
import { LeaveRequest } from './LeaveRequest';
import { plainToInstance } from 'class-transformer';
import { RoleName } from '../types/RoleName';
import { User } from './User';

describe('Management Pair entity validation', () => {
  const validUserID = new User();
  const validLeaveType = 'Annual';
  const validStartDate = new Date('01-01-2025');
  const validEndDate = new Date('02-02-2026');
  const validStatus = 'Pending';
  const validReason = 'Ok to approve';

  it('Invalid when userID not present', async () => {
    const invalidReq = plainToInstance(LeaveRequest, {
      leaveType: validLeaveType,
      startDate: validStartDate,
      endDate: validEndDate,
      status: validStatus,
      reason: validStatus,
    });
    const errors = await validate(invalidReq);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotEmpty).toBeDefined();
  });

  it('Invalid when leaveType is not string', async () => {
    const invalidReq = plainToInstance(LeaveRequest, {
      userID: validUserID,
      leaveType: 37,
      startDate: validStartDate,
      endDate: validEndDate,
      status: validStatus,
      reason: validStatus,
    });
    const errors = await validate(invalidReq);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isString).toBeDefined();
  });

  it('Invalid when startDate != date', async () => {
    const invalidReq = plainToInstance(LeaveRequest, {
      userID: validUserID,
      leaveType: validLeaveType,
      startDate: 'Not a date',
      endDate: validEndDate,
      status: validStatus,
      reason: validStatus,
    });
    const errors = await validate(invalidReq);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isDate).toBeDefined();
  });

  it('Invalid when endDate != date', async () => {
    const invalidReq = plainToInstance(LeaveRequest, {
      userID: validUserID,
      leaveType: validLeaveType,
      startDate: validStartDate,
      endDate: 'Not a date',
      status: validStatus,
      reason: validStatus,
    });
    const errors = await validate(invalidReq);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isDate).toBeDefined();
  });

  it('Invalid when status is not string', async () => {
    const invalidReq = plainToInstance(LeaveRequest, {
      userID: validUserID,
      leaveType: validLeaveType,
      startDate: validStartDate,
      endDate: validEndDate,
      status: 59,
      reason: validStatus,
    });
    const errors = await validate(invalidReq);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isString).toBeDefined();
  });

  it('Invalid when reason exceeds 128 char', async () => {
    const invalidReq = plainToInstance(LeaveRequest, {
      userID: validUserID,
      leaveType: validLeaveType,
      startDate: validStartDate,
      endDate: validEndDate,
      status: validStatus,
      reason: 'x'.repeat(129),
    });
    const errors = await validate(invalidReq);
    console.log(errors);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.maxLength).toBeDefined();
  });

  it('Valid when valid request', async () => {
    const validReq = plainToInstance(LeaveRequest, {
      userID: validUserID,
      leaveType: validLeaveType,
      startDate: validStartDate,
      endDate: validEndDate,
      status: validStatus,
      reason: validReason,
    });
    const errors = await validate(validReq);
    errors.forEach((err) => console.log(err));
    expect(errors.length).toBe(0);
  });
});
