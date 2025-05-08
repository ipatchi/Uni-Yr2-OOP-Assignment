import { validate } from 'class-validator';
import { Role } from './Role';

describe('Role entity validation', () => {
  it('A blank name is considered invalid', async () => {
    const invalidRole = new Role();
    invalidRole.name = '';

    const errors = await validate(invalidRole);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotEmpty).toBeDefined();
  });

  it('A name of only spaces is invalid', async () => {
    const invalidRole = new Role();
    invalidRole.name = '   ';

    const errors = await validate(invalidRole);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.matches).toBeDefined();
  });

  it('A name cannot be greater than 30 characters', async () => {
    const invalidRole = new Role();
    invalidRole.name = 'x'.repeat(31);

    const errors = await validate(invalidRole);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.maxLength).toBeDefined();
  });

  it('A valid name will be accpeted', async () => {
    const invalidRole = new Role();
    invalidRole.name = 'ShelfStacker';

    const errors = await validate(invalidRole);
    expect(errors.length).toBe(0);
  });
});
