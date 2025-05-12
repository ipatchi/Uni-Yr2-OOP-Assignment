import { Role } from '../entity/Role';

export class UserDTOToken {
  constructor(private email: string, private role: Role) {}
}
