import { validate } from 'class-validator';
import { Role } from './Role';
import { plainToInstance } from 'class-transformer';
import { RoleName } from '../types/RoleName';

describe('Role entity validation', () => {
  it('A blank name is considered invalid', async () => {
    const invalidRole = plainToInstance(Role, { name: '' });
    const errors = await validate(invalidRole);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotEmpty).toBeDefined();
  });

  it('A name of only spaces is invalid', async () => {
    const invalidRole = plainToInstance(Role, { name: '     ' });
    const errors = await validate(invalidRole);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.matches).toBeDefined();
  });

  it('A name cannot be greater than 30 characters', async () => {
    const invalidRole = plainToInstance(Role, { name: 'x'.repeat(31) });
    const errors = await validate(invalidRole);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.maxLength).toBeDefined();
  });

  it('A valid name will be accpeted', async () => {
    const invalidRole = plainToInstance(Role, { name: RoleName.EMPLOYEE });
    const errors = await validate(invalidRole);
    expect(errors.length).toBe(0);
  });
});
