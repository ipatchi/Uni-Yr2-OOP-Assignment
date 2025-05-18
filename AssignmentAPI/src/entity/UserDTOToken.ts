import { Role } from './Role';
import { RoleName } from '../types/RoleName';

export class UserDTOToken {
  constructor(private email: string, private role: RoleName) {}
}
