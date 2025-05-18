import { validate } from 'class-validator';
import { Manager } from './Manager';
import { plainToInstance } from 'class-transformer';
import { RoleName } from '../types/RoleName';
import { User } from './User';

describe('Management Pair entity validation', () => {
  let validManager: User;
  let validUser: User;

  beforeEach(() => {
    validManager = new User();
    validManager.userID = 1;

    validUser = new User();
    validUser.userID = 2;
  });
  it('A management pair without a manager is invalid', async () => {
    const invalidPair = plainToInstance(Manager, { userID: validUser });
    const errors = await validate(invalidPair);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotEmpty).toBeDefined();
  });

  it('A management pair without a user is invalid', async () => {
    const invalidPair = plainToInstance(Manager, { managerID: validManager });
    const errors = await validate(invalidPair);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotEmpty).toBeDefined();
  });

  it('A valid manager pair will be accpeted', async () => {
    const validPair = plainToInstance(Manager, {
      userID: validUser,
      managerID: validManager,
    });
    const errors = await validate(validPair);
    expect(errors.length).toBe(0);
  });
});
