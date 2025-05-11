import { User } from './User';
import { Role } from './Role';
import * as ClassTransformer from 'class-transformer';
import { instanceToPlain } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryFailedError, Repository } from 'typeorm';
import { mock } from 'jest-mock-extended';

describe('User entity', () => {
  let mockUserRepository: jest.Mocked<Repository<User>>;
  let user: User;
  let role: Role;

  beforeEach(() => {
    mockUserRepository = mock<Repository<User>>();
    role = new Role();
    role.roleID = 1;
    role.name = 'Admin';

    user = new User();
    user.userID = 1;
    user.email = 'test@email.com';
    user.firstname = 'Bob';
    user.surname = 'Smith';
    user.password = 'x'.repeat(10);
    user.roleID = role;
  });

  it('A user with valid details will not return their password on submit', () => {
    jest.spyOn(ClassTransformer, 'instanceToPlain').mockReturnValue({
      userID: user.userID,
      email: user.email,
      firstname: user.firstname,
      surname: user.surname,
      roleID: { roleID: user.roleID.roleID, name: user.roleID.name },
    } as any);

    const plainUser = instanceToPlain(user);
    expect(plainUser).toHaveProperty('userID', user.userID);
    expect(plainUser).toHaveProperty('email', user.email);
    expect(plainUser).toHaveProperty('firstname', user.firstname);
    expect(plainUser).toHaveProperty('surname', user.surname);
    expect(plainUser).toHaveProperty('roleID', {
      roleID: role.roleID,
      name: role.name,
    });

    expect(plainUser).not.toHaveProperty('password');
  });

  it('Users will not include a password from a get request', async () => {
    const user = new User();
    mockUserRepository.findOne.mockResolvedValue({
      userID: user.userID,
      email: user.email,
      firstname: user.firstname,
      surname: user.surname,
      roleID: { roleID: role.roleID, name: role.name },
    } as User);

    const retrievedUser = await mockUserRepository.findOne({
      where: { userID: user.userID },
    });

    expect(retrievedUser).toBeDefined();
    expect(retrievedUser).toHaveProperty('userID', user.userID);
    expect(retrievedUser).toHaveProperty('email', user.email);
    expect(retrievedUser).toHaveProperty('firstname', user.firstname);
    expect(retrievedUser).toHaveProperty('surname', user.surname);
    expect(retrievedUser).toHaveProperty('roleID', {
      roleID: role.roleID,
      name: role.name,
    });

    expect(retrievedUser).not.toHaveProperty('password');
  });

  it('Cannot have duplicate email addresses ', async () => {
    mockUserRepository.save.mockImplementationOnce((user: User) =>
      Promise.resolve(user)
    );

    mockUserRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO user',
        [],
        new Error(`#1062 - Duplicate entry ${user.email} for key 'email'`)
      )
    );

    await expect(mockUserRepository.save(user)).resolves.toEqual(user);

    const userWithDuplicateEmailAddress = new User();
    userWithDuplicateEmailAddress.email = user.email;
    userWithDuplicateEmailAddress.firstname = user.firstname;
    userWithDuplicateEmailAddress.surname = user.surname;
    userWithDuplicateEmailAddress.password = 'x'.repeat(10);

    userWithDuplicateEmailAddress.roleID = role;

    await expect(
      mockUserRepository.save(userWithDuplicateEmailAddress)
    ).rejects.toThrow(QueryFailedError);
  });

  //---- Non Mocked Tests ----

  const VALID_PASSWORD = 'x'.repeat(10);
  const VALID_EMAIL = 'test@email.com';
  const VALID_FIRSTNAME = 'Bob';
  const VALID_SURNAME = 'Smith';

  beforeAll(() => {
    role = new Role();
    role.roleID = 1;
    role.name = 'Admin';
  });

  it('A password must be a string', async () => {
    const invalidUser = new User();
    invalidUser.email = VALID_EMAIL;
    invalidUser.password = 1234 as any;
    invalidUser.firstname = VALID_FIRSTNAME;
    invalidUser.surname = VALID_SURNAME;
    invalidUser.roleID = role;

    const errors = await validate(invalidUser);

    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('A password less than 10 characters is invalid', async () => {
    const invalidUser = new User();
    invalidUser.email = VALID_EMAIL;
    invalidUser.firstname = VALID_FIRSTNAME;
    invalidUser.surname = VALID_SURNAME;
    invalidUser.password = 'x'.repeat(9);
    invalidUser.roleID = role;

    const errors = await validate(invalidUser);

    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('A poorly formed email is invalid', async () => {
    const invalidUser = new User();
    invalidUser.email = 'not an email address';
    invalidUser.firstname = VALID_FIRSTNAME;
    invalidUser.surname = VALID_SURNAME;
    invalidUser.password = VALID_PASSWORD;
    invalidUser.roleID = role;

    const errors = await validate(invalidUser);

    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('A user requires a role', async () => {
    const invalidUser = new User();
    invalidUser.email = VALID_EMAIL;
    invalidUser.firstname = VALID_FIRSTNAME;
    invalidUser.surname = VALID_SURNAME;
    invalidUser.password = VALID_PASSWORD;
    invalidUser.roleID = null;

    const errors = await validate(invalidUser);

    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('A valid user is accepted', async () => {
    const invalidUser = new User();
    invalidUser.email = VALID_EMAIL;
    invalidUser.firstname = VALID_FIRSTNAME;
    invalidUser.surname = VALID_SURNAME;
    invalidUser.password = VALID_PASSWORD;
    invalidUser.roleID = role;

    const errors = await validate(invalidUser);

    expect(errors.length).toBe(0);
  });
});
