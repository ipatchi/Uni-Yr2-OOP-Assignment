import { Request } from 'express';
import { Role } from '../entity/Role';
import { RoleName } from './RoleName';

export interface IAuthenticatedJWTRequest extends Request {
  signedInUser?: {
    email?: string;
    role?: RoleName;
  };
}
